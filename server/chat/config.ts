import { z } from "zod";

export const LIMITS = {
  messageChars: 1000, assistantChars: 4000, bodyBytes: 32 * 1024,
  messages: 9, sessionMessages: 20, inputTokens: 6000, outputTokens: 400,
  timeoutMs: 45_000, sessionSeconds: 86_400,
} as const;

const price = z.coerce.number().positive().max(1000).refine(n => Number.isInteger(n * 1000));
const schema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().trim().min(1),
  OPENAI_TOKEN_ENCODING: z.enum(["o200k_base", "cl100k_base"]),
  OPENAI_INPUT_USD_PER_1M: price,
  OPENAI_CACHED_INPUT_USD_PER_1M: price,
  OPENAI_OUTPUT_USD_PER_1M: price,
  CHAT_MONTHLY_BUDGET_USD: z.coerce.number().positive().max(10000),
  UPSTASH_REDIS_REST_URL: z.url().startsWith("https://"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  CHAT_SESSION_SECRET: z.string().min(32),
  RATE_LIMIT_HASH_SECRET: z.string().min(32),
  ALLOWED_ORIGIN: z.string().min(1),
});
export type ChatConfig = z.infer<typeof schema> & { namespace: string; secure: boolean };

export function allowedOrigins(env = process.env): string[] {
  return (env.ALLOWED_ORIGIN ?? "").split(",").map(s => s.trim()).filter(s => {
    try { const url = new URL(s); return url.origin === s && ["https:", "http:"].includes(url.protocol); }
    catch { return false; }
  });
}

type ConfigResult = { config: ChatConfig; code?: never; fields?: never }
  | { config: null; code: "chat_disabled" | "missing_config" | "invalid_config"; fields: string[] };

// Only schema field names leave this function on failure, never Zod issues or input values.
export function inspectConfig(env = process.env): ConfigResult {
  if (!env.CHAT_ENABLED) return { config: null, code: "missing_config", fields: ["CHAT_ENABLED"] };
  if (env.CHAT_ENABLED === "false") return { config: null, code: "chat_disabled", fields: [] };
  if (env.CHAT_ENABLED !== "true") return { config: null, code: "invalid_config", fields: ["CHAT_ENABLED"] };
  const missing = Object.keys(schema.shape).filter(key => !env[key]?.trim());
  if (missing.length) return { config: null, code: "missing_config", fields: missing };
  const result = schema.safeParse(env);
  if (!result.success) return { config: null, code: "invalid_config", fields: [...new Set(result.error.issues.map(issue => String(issue.path[0])))] };
  if (!allowedOrigins(env).length) return { config: null, code: "invalid_config", fields: ["ALLOWED_ORIGIN"] };
  const data = result.data;
  if (data.OPENAI_CACHED_INPUT_USD_PER_1M > data.OPENAI_INPUT_USD_PER_1M) return { config: null, code: "invalid_config", fields: ["OPENAI_CACHED_INPUT_USD_PER_1M"] };
  const environment = env.VERCEL_ENV ?? "development";
  // Preview deployments deliberately share a budget; they cannot multiply the monthly allowance.
  return { config: { ...data, namespace: `novavision:chat:${environment}`, secure: (env.VERCEL === "1" && environment !== "development") || env.NODE_ENV === "production" } };
}

export function readConfig(env = process.env): ChatConfig | null {
  const result = inspectConfig(env);
  if (!result.config) console.warn(JSON.stringify({ event: "chat_unavailable", code: result.code, fields: result.fields }));
  return result.config;
}
