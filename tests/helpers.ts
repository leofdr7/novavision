import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { createClient } from "redis";
import { Redis } from "@upstash/redis";
import type { ChatConfig } from "../server/chat/config";

export function testConfig(overrides: Partial<ChatConfig> = {}): ChatConfig {
  return {
    OPENAI_API_KEY: "test-key", OPENAI_MODEL: "configured-test-model", OPENAI_TOKEN_ENCODING: "o200k_base",
    OPENAI_INPUT_USD_PER_1M: 0.4, OPENAI_CACHED_INPUT_USD_PER_1M: 0.1, OPENAI_OUTPUT_USD_PER_1M: 1.6,
    CHAT_MONTHLY_BUDGET_USD: 10, ALLOWED_ORIGIN: "https://www.novavision.com.sv",
    UPSTASH_REDIS_REST_URL: "https://redis.invalid", UPSTASH_REDIS_REST_TOKEN: "test-token",
    CHAT_SESSION_SECRET: "s".repeat(40), RATE_LIMIT_HASH_SECRET: "h".repeat(40),
    namespace: `test:novavision:${randomUUID()}`, secure: false, ...overrides,
  };
}
export async function listen(server: Server) {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test address");
  return `http://127.0.0.1:${address.port}`;
}
export async function closeServer(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

// Exercise the real Upstash SDK and Lua scripts against a disposable local Redis.
// This bridge only adapts the wire protocol; it does not reimplement accounting or rate limits.
export async function redisHarness() {
  const native = createClient({ url: process.env.TEST_REDIS_URL });
  await native.connect();
  const bridge = createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const data: unknown[] = JSON.parse(Buffer.concat(chunks).toString());
      const run = async (command: unknown[]) => {
        // Upstash's optional script locking flag is not supported by upstream Redis.
        // Strip only this execution hint; run the SDK's actual Lua unchanged.
        if (String(command[0]).toUpperCase() === "EVAL" && typeof command[1] === "string") command[1] = command[1].replace(/^#!lua flags=allow-key-locking\n/, "");
        try { return { result: await native.sendCommand(command.map(String)) }; }
        catch (error) { return { error: error instanceof Error ? error.message : "Redis failure" }; }
      };
      const result = req.url?.includes("pipeline") ? await Promise.all((data as unknown[][]).map(run)) : await run(data);
      res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(result));
    } catch { res.statusCode = 500; res.end('{}'); }
  });
  const url = await listen(bridge);
  const redis = new Redis({ url, token: "test", responseEncoding: false, enableAutoPipelining: false, retry: false });
  return { redis, native, close: async () => { await closeServer(bridge); await native.quit(); } };
}
