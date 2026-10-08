import type { Redis } from "@upstash/redis";
import { LIMITS, type ChatConfig } from "./config.js";
import { ChatError } from "./errors.js";

export type Usage = { input: number; cached: number; output: number };
export const RETENTION_SECONDS = 60 * 86_400;

export function monthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/El_Salvador", year: "numeric", month: "2-digit" }).formatToParts(date);
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
}
export function usageCost(usage: Usage, config: ChatConfig) {
  if (![usage.input, usage.cached, usage.output].every(n => Number.isSafeInteger(n) && n >= 0) || usage.cached > usage.input) throw new ChatError(502, "invalid_usage");
  return (usage.input - usage.cached) * Math.round(config.OPENAI_INPUT_USD_PER_1M * 1000)
    + usage.cached * Math.round(config.OPENAI_CACHED_INPUT_USD_PER_1M * 1000)
    + usage.output * Math.round(config.OPENAI_OUTPUT_USD_PER_1M * 1000);
}
export const reservationCost = (config: ChatConfig) => usageCost({ input: LIMITS.inputTokens, cached: 0, output: LIMITS.outputTokens }, config);

// All decisions and accounting are made on the Redis primary in a single atomic script.
// A reservation never expires independently of its monthly counter: crashes cannot free uncertain spend.
export const RESERVE = `
if redis.call('EXISTS', KEYS[2]) == 1 then return -1 end
local used = tonumber(redis.call('HGET', KEYS[1], 'used') or '0')
local reserved = tonumber(redis.call('HGET', KEYS[1], 'reserved') or '0')
if used + reserved + tonumber(ARGV[1]) > tonumber(ARGV[2]) then return 0 end
redis.call('HINCRBY', KEYS[1], 'reserved', ARGV[1])
redis.call('HSET', KEYS[2], 'amount', ARGV[1], 'state', 'reserved')
redis.call('EXPIRE', KEYS[1], ARGV[3]); redis.call('EXPIRE', KEYS[2], ARGV[3])
return 1`;

export const SETTLE = `
if redis.call('HGET', KEYS[2], 'state') ~= 'reserved' then return {0, 0} end
local amount = tonumber(redis.call('HGET', KEYS[2], 'amount'))
redis.call('HINCRBY', KEYS[1], 'reserved', -amount)
local used = redis.call('HINCRBY', KEYS[1], 'used', ARGV[1])
redis.call('HSET', KEYS[2], 'state', 'settled')
local warn = 0
if used >= tonumber(ARGV[2]) * 0.8 and redis.call('HSETNX', KEYS[1], 'warned80', '1') == 1 then warn = 1 end
redis.call('EXPIRE', KEYS[1], ARGV[3]); redis.call('EXPIRE', KEYS[2], ARGV[3])
return {warn, used}`;

export class Budget {
  private readonly key: string;
  private readonly ceiling: number;
  private readonly redis: Redis;
  private readonly config: ChatConfig;
  constructor(redis: Redis, config: ChatConfig, date = new Date()) {
    this.redis = redis; this.config = config;
    this.key = `${config.namespace}:budget:${monthKey(date)}`;
    this.ceiling = Math.floor(config.CHAT_MONTHLY_BUDGET_USD * 1e9);
  }
  async available() {
    const values = await this.redis.hmget<Record<string, number>>(this.key, "used", "reserved");
    return Number(values?.used ?? 0) + Number(values?.reserved ?? 0) + reservationCost(this.config) <= this.ceiling;
  }
  async reserve(id: string) {
    const requestKey = `${this.key}:request:${id}`;
    const result = await this.redis.eval<number[], number>(RESERVE, [this.key, requestKey], [reservationCost(this.config), this.ceiling, RETENTION_SECONDS]);
    if (result === -1) throw new ChatError(409, "duplicate_request");
    if (result !== 1) throw new ChatError(503, "budget_exceeded");
    return {
      // Only call with zero when it is certain no inference was started.
      settle: async (usage: Usage) => {
        const [warn, used] = await this.redis.eval<number[], [number, number]>(SETTLE, [this.key, requestKey], [usageCost(usage, this.config), this.ceiling, RETENTION_SECONDS]);
        if (warn) console.warn(JSON.stringify({ event: "chat_budget_80_percent", month: this.key.split(":").at(-1), environment: this.config.namespace, estimatedUsd: used / 1e9 }));
      },
    };
  }
}
