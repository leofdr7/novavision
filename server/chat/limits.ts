import { CHAT_CONTACT_HELP } from "../../shared/chat.js";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { LIMITS, type ChatConfig } from "./config.js";
import { ChatError } from "./errors.js";

export function makeRedis(config: ChatConfig) {
  return new Redis({ url: config.UPSTASH_REDIS_REST_URL, token: config.UPSTASH_REDIS_REST_TOKEN,
    retry: false, signal: () => AbortSignal.timeout(3000) });
}

export async function enforceIp(redis: Redis, config: ChatConfig, key: string, method: "GET" | "POST") {
  const rules = method === "GET" ? [[10, "1 m", "init"]] as const : [[6, "1 m", "minute"], [60, "1 d", "day"]] as const;
  for (const [count, duration, name] of rules) {
    const result = await new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(count, duration),
      prefix: `${config.namespace}:ip:${name}`, analytics: false, ephemeralCache: false, timeout: 2500,
    }).limit(key);
    if (result.reason === "timeout") throw new ChatError(503, "limits_unavailable");
    if (!result.success) throw new ChatError(429, "rate_limited", `Has enviado varios mensajes. Espera un momento. ${CHAT_CONTACT_HELP}`, Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)));
  }
}

export const ADMIT_SESSION = `
if redis.call('EXISTS', KEYS[3]) == 1 then return {-1, 0} end
if redis.call('EXISTS', KEYS[2]) == 1 then return {-2, 0} end
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
if used >= tonumber(ARGV[1]) then return {-3, 0} end
redis.call('SET', KEYS[3], '1', 'EX', ARGV[2])
redis.call('SET', KEYS[2], ARGV[3], 'EX', 60)
redis.call('INCR', KEYS[1]); redis.call('EXPIRE', KEYS[1], ARGV[2])
return {1, tonumber(ARGV[1]) - used - 1}`;
export const RELEASE_SESSION = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`;

export async function admitSession(redis: Redis, config: ChatConfig, sessionId: string, requestId: string) {
  const base = `${config.namespace}:session:${sessionId}`;
  const [code, remaining] = await redis.eval<(number | string)[], [number, number]>(ADMIT_SESSION,
    [base, `${base}:lock`, `${base}:request:${requestId}`], [LIMITS.sessionMessages, LIMITS.sessionSeconds, requestId]);
  if (code === -1) throw new ChatError(409, "duplicate_request", "Este mensaje ya fue enviado.");
  if (code === -2) throw new ChatError(409, "session_busy", "Espera a que termine la respuesta actual.");
  if (code === -3) throw new ChatError(429, "session_limit", `Has llegado al límite de esta sesión. ${CHAT_CONTACT_HELP}`);
  return { remaining, release: () => redis.eval(RELEASE_SESSION, [`${base}:lock`], [requestId]) };
}
