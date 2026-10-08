import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import type { Redis } from "@upstash/redis";
import { describe, expect, it, vi } from "vitest";
import { createChatHandler } from "../api/chat";
import { inspectConfig, readConfig } from "../server/chat/config";
import { ChatError } from "../server/chat/errors";
import { testConfig } from "./helpers";

const env = () => ({ ...Object.fromEntries(Object.entries(testConfig()).map(([k, v]) => [k, String(v)])), CHAT_ENABLED: "true" });

it("distinguishes absent, disabled, malformed and complete runtime configuration", () => {
  expect(inspectConfig({})).toMatchObject({ config: null, code: "missing_config", fields: ["CHAT_ENABLED"] });
  expect(inspectConfig({ CHAT_ENABLED: "false" })).toMatchObject({ code: "chat_disabled" });
  expect(inspectConfig({ CHAT_ENABLED: "TRUE" })).toMatchObject({ code: "invalid_config", fields: ["CHAT_ENABLED"] });
  expect(inspectConfig({ ...env(), OPENAI_API_KEY: "" })).toMatchObject({ code: "missing_config", fields: ["OPENAI_API_KEY"] });
  expect(inspectConfig({ ...env(), CHAT_SESSION_SECRET: "short" })).toMatchObject({ code: "invalid_config", fields: ["CHAT_SESSION_SECRET"] });
  expect(inspectConfig({ ...env(), ALLOWED_ORIGIN: "invalid" })).toMatchObject({ code: "invalid_config", fields: ["ALLOWED_ORIGIN"] });
  expect(inspectConfig({ ...env(), OPENAI_CACHED_INPUT_USD_PER_1M: "1" })).toMatchObject({ code: "invalid_config", fields: ["OPENAI_CACHED_INPUT_USD_PER_1M"] });
  expect(inspectConfig(env()).config).not.toBeNull();
});

async function get(overrides: Parameters<typeof createChatHandler>[0]) {
  let body = "";
  const req = { method: "GET", headers: {}, socket: { remoteAddress: "private-ip-sentinel" } } as IncomingMessage;
  const res = Object.assign(new EventEmitter(), {
    statusCode: 200, destroyed: false, writableEnded: false,
    setHeader: vi.fn(), end(value: string) { body = value; this.writableEnded = true; },
  });
  await createChatHandler(overrides)(req, res as unknown as ServerResponse);
  return { status: res.statusCode, body: JSON.parse(body) };
}

describe("GET availability diagnostics without sensitive output", () => {
  it.each(["chat_disabled", "missing_config", "invalid_config"])("logs %s without changing the public fallback", async code => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const input = code === "chat_disabled" ? { CHAT_ENABLED: "false" } : code === "missing_config" ? {} : { ...env(), OPENAI_TOKEN_ENCODING: "private-invalid-value" };
    const redis = vi.fn();
    const response = await get({ readConfig: () => readConfig(input), makeRedis: redis });
    expect(response.status).toBe(200); expect(response.body.available).toBe(false);
    expect(response.body).not.toHaveProperty("contacts"); expect(redis).not.toHaveBeenCalled();
    expect(JSON.parse(warn.mock.calls[0][0])).toMatchObject({ event: "chat_unavailable", code });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("private-");
    expect(response.body).not.toHaveProperty("fields");
  });
  it.each(["ready", "budget_exceeded", "session_limit", "redis_unavailable", "redis_timeout"])("reports %s after configuration is accepted", async mode => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const redis = {
      get: async () => mode === "session_limit" ? 20 : null,
      hmget: async () => { if (mode === "redis_unavailable") throw new Error("private-credentials-and-message"); return { used: mode === "budget_exceeded" ? 10e9 : 0, reserved: 0 }; },
    } as unknown as Redis;
    const response = await get({ readConfig: () => testConfig(), makeRedis: () => redis,
      enforceIp: async () => { if (mode === "redis_timeout") throw new ChatError(503, "limits_unavailable"); },
    });
    if (mode === "ready") { expect(response.body.available).toBe(true); expect(warn).not.toHaveBeenCalled(); }
    else if (mode.startsWith("redis_")) { expect(response.status).toBe(503); expect(response.body.error.code).toBe("redis_unavailable"); }
    else { expect(response.status).toBe(200); expect(response.body.available).toBe(false); }
    if (mode !== "ready") expect(JSON.parse(warn.mock.calls[0][0]).code).toBe(mode === "redis_timeout" ? "redis_unavailable" : mode);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("private-");
  });
});

it("loads .env.local into the CLI child while respecting exported variables", () => {
  const cwd = mkdtempSync(join(tmpdir(), "chat-env-test-"));
  try {
    writeFileSync(join(cwd, ".env.local"), 'CHAT_BOOTSTRAP_TEST="private-local-sentinel"\nCHAT_BOOTSTRAP_EXISTING=file\n');
    // A stand-in CLI verifies inheritance without a Vercel account or network access.
    writeFileSync(join(cwd, "npx"), `#!${process.execPath}\nconsole.log(JSON.stringify({loaded:process.env.CHAT_BOOTSTRAP_TEST==='private-local-sentinel',preserved:process.env.CHAT_BOOTSTRAP_EXISTING==='exported',args:process.argv.slice(2)}));\n`, { mode: 0o700 });
    const result = spawnSync(process.execPath, [resolve("scripts/dev-full.mjs"), "--listen", "3001"], {
      cwd, encoding: "utf8", env: { ...process.env, PATH: `${cwd}:${process.env.PATH}`, CHAT_BOOTSTRAP_EXISTING: "exported" },
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ loaded: true, preserved: true, args: ["vercel", "dev", "--listen", "3001"] });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
