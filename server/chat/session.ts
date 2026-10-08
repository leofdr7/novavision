import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { LIMITS, type ChatConfig } from "./config.js";
import { ChatError } from "./errors.js";

const COOKIE = "nv_chat";
export type Session = { id: string; expires: number };
const signature = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function readSession(cookie: string | undefined, secret: string, now = Date.now()): Session | null {
  const token = cookie?.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token || token.length > 512) return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra || !/^[A-Za-z0-9_-]{43}$/.test(sig) || !/^[A-Za-z0-9_-]+$/.test(payload)) return null;
  const expected = signature(payload, secret);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (typeof session.id !== "string" || !/^[a-f0-9-]{36}$/.test(session.id) || !Number.isFinite(session.expires) || session.expires <= now) return null;
    return session;
  } catch { return null; }
}

export function createSession(config: ChatConfig, now = Date.now()) {
  const session = { id: randomUUID(), expires: now + LIMITS.sessionSeconds * 1000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { session, cookie: `${COOKIE}=${payload}.${signature(payload, config.CHAT_SESSION_SECRET)}; Path=/api/chat; HttpOnly; SameSite=Strict${config.secure ? "; Secure" : ""}` };
}

export function clientKey(req: IncomingMessage, config: ChatConfig): string {
  // Vercel overwrites this header at its trusted proxy. Never trust user-provided X-Forwarded-For.
  const header = req.headers["x-vercel-forwarded-for"];
  const hosted = process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "development";
  const ip = hosted ? (typeof header === "string" ? header.split(",")[0]?.trim() : undefined) : req.socket.remoteAddress;
  if (!ip) throw new ChatError(503, "client_unavailable");
  return createHmac("sha256", config.RATE_LIMIT_HASH_SECRET).update(ip).digest("hex");
}
