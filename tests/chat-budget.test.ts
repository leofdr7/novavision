import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Budget, monthKey, reservationCost, usageCost } from "../server/chat/budget";
import { admitSession, enforceIp } from "../server/chat/limits";
import type { Redis } from "@upstash/redis";
import { redisHarness, testConfig } from "./helpers";

it("counts uncached, cached and output tokens at configured prices", () => {
  expect(usageCost({ input: 12000, cached: 0, output: 1000 }, testConfig())).toBe(6_400_000);
  expect(usageCost({ input: 1000, cached: 500, output: 100 }, testConfig())).toBe(410_000);
  expect(() => usageCost({ input: 1, cached: 2, output: 0 }, testConfig())).toThrow();
});
it("uses El Salvador month boundaries", () => {
  expect(monthKey(new Date("2026-11-01T05:59:59Z"))).toBe("2026-10");
  expect(monthKey(new Date("2026-11-01T06:00:00Z"))).toBe("2026-11");
});
it("rejects Upstash's fail-open timeout result", async () => {
  const stalled = { evalsha: () => new Promise(() => undefined), eval: () => new Promise(() => undefined) } as unknown as Redis;
  await expect(enforceIp(stalled, testConfig(), "ip", "POST")).rejects.toMatchObject({ code: "limits_unavailable" });
});

describe.skipIf(!process.env.TEST_REDIS_URL)("distributed accounting with real Redis", () => {
  let harness: Awaited<ReturnType<typeof redisHarness>>;
  beforeAll(async () => { harness = await redisHarness(); });
  afterAll(async () => { await harness?.close(); });
  it("reserves atomically across instances and keeps unknown usage reserved", async () => {
    const config = testConfig(); config.CHAT_MONTHLY_BUDGET_USD = reservationCost(config) * 3 / 1e9;
    const attempts = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => new Budget(harness.redis, config).reserve(String(i))));
    expect(attempts.filter(a => a.status === "fulfilled")).toHaveLength(3);
    expect(await new Budget(harness.redis, config).available()).toBe(false);
  });
  it("settles once, warns once at 80%, and blocks at 100%", async () => {
    const config = testConfig({ CHAT_MONTHLY_BUDGET_USD: 0.004 });
    const budget = new Budget(harness.redis, config);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const reservation = await budget.reserve("one");
    const usage = { input: 0, cached: 0, output: 2500 };
    await Promise.all([reservation.settle(usage), reservation.settle(usage)]);
    const key = `${config.namespace}:budget:${monthKey()}`;
    expect(Number(await harness.redis.hget(key, "used"))).toBe(4_000_000);
    expect(Number(await harness.redis.hget(key, "reserved"))).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(await budget.available()).toBe(false);
    await expect(budget.reserve("two")).rejects.toMatchObject({ code: "budget_exceeded" });
    expect(await new Budget(harness.redis, config, new Date("2027-01-02T12:00:00Z")).available()).toBe(true);
    expect(await harness.redis.ttl(key)).toBeGreaterThan(59 * 86400);
  });
  it("releases only definitely unused reservations and rejects duplicate IDs", async () => {
    const config = testConfig(); const budget = new Budget(harness.redis, config);
    const reservation = await budget.reserve("unique");
    await expect(budget.reserve("unique")).rejects.toMatchObject({ code: "duplicate_request" });
    await reservation.settle({ input: 0, cached: 0, output: 0 });
    expect(Number(await harness.redis.hget(`${config.namespace}:budget:${monthKey()}`, "reserved"))).toBe(0);
  });
  it("serializes a session, detects replays, and limits it to 20 requests", async () => {
    const config = testConfig();
    const first = await admitSession(harness.redis, config, "session", "one");
    await expect(admitSession(harness.redis, config, "session", "two")).rejects.toMatchObject({ code: "session_busy" });
    await first.release();
    await expect(admitSession(harness.redis, config, "session", "one")).rejects.toMatchObject({ code: "duplicate_request" });
    for (let i = 1; i < 20; i++) { const next = await admitSession(harness.redis, config, "session", String(i)); await next.release(); }
    await expect(admitSession(harness.redis, config, "session", "last")).rejects.toMatchObject({ code: "session_limit" });
  });
  it("shares IP limits between instances of the Upstash limiter", async () => {
    const config = testConfig();
    for (let i = 0; i < 6; i++) await enforceIp(harness.redis, config, "hashed-ip", "POST");
    await expect(enforceIp(harness.redis, config, "hashed-ip", "POST")).rejects.toMatchObject({ code: "rate_limited" });
  });
});
