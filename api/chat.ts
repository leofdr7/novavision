import type { IncomingMessage, ServerResponse } from "node:http";
import OpenAI from "openai";
import { CHAT_UNAVAILABLE, type ChatEvent, type ChatInit } from "../shared/chat.js";
import { allowedOrigins, LIMITS, readConfig } from "../server/chat/config.js";
import { ChatError } from "../server/chat/errors.js";
import { clientKey, createSession, readSession } from "../server/chat/session.js";
import { admitSession, enforceIp, makeRedis } from "../server/chat/limits.js";
import { Budget } from "../server/chat/budget.js";
import { fitHistory, validateRequest } from "../server/chat/validation.js";
import { conversationPrompt, medicalRedirect } from "../server/chat/prompt.js";
import { serviceReply } from "../server/chat/services.js";
import { streamAnswer } from "../server/chat/stream.js";

export const config = { maxDuration: 60 };

type ChatRequest = IncomingMessage & { body?: unknown };
async function redisOperation<T>(operation: () => T | Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof ChatError && error.code !== "limits_unavailable") throw error;
    throw new ChatError(503, "redis_unavailable");
  }
}
async function readBody(req: ChatRequest): Promise<unknown> {
  if (Number(req.headers["content-length"] ?? 0) > LIMITS.bodyBytes) throw new ChatError(413, "body_too_large");
  if (!req.headers["content-type"]?.toLowerCase().startsWith("application/json")) throw new ChatError(400, "invalid_content_type");
  if (req.body !== undefined) {
    const serialized = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(serialized) > LIMITS.bodyBytes) throw new ChatError(413, "body_too_large");
    try { return typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
    catch { throw new ChatError(400, "invalid_json"); }
  }
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > LIMITS.bodyBytes) throw new ChatError(413, "body_too_large");
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ChatError(400, "invalid_json"); }
}

const dependencies = { readConfig, makeRedis, enforceIp, admitSession, streamAnswer };
export function createChatHandler(overrides: Partial<typeof dependencies> = {}) {
  const deps = { ...dependencies, ...overrides };
  return async function handler(req: ChatRequest, res: ServerResponse) {
    res.setHeader("Cache-Control", "no-store, no-transform");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Vary", "Origin");
    let release: (() => Promise<unknown>) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    let timedOut = false;
    const abort = new AbortController();
    const disconnect = () => { if (!res.writableEnded) abort.abort(); };
    res.on("close", disconnect);
    const send = (event: ChatEvent) => { if (!res.destroyed) res.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`); };
    const begin = () => { res.statusCode = 200; res.setHeader("Content-Type", "text/event-stream; charset=utf-8"); res.flushHeaders(); started = true; };
    try {
      const origin = req.headers.origin;
      if ((origin && !allowedOrigins().includes(origin)) || ((req.method === "POST" || req.method === "OPTIONS") && !origin) || req.headers["sec-fetch-site"] === "cross-site") throw new ChatError(403, "origin_rejected");
      if (origin) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Access-Control-Allow-Credentials", "true"); }
      if (req.method === "OPTIONS") { res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); res.statusCode = 204; res.end(); return; }
      if (req.method !== "GET" && req.method !== "POST") { res.setHeader("Allow", "GET, POST, OPTIONS"); throw new ChatError(405, "method_not_allowed"); }
      const settings = deps.readConfig();
      if (!settings) {
        if (req.method === "POST") throw new ChatError(503, "chat_unavailable");
        const init: ChatInit = { available: false, limits: { maxMessageChars: LIMITS.messageChars, maxSessionMessages: LIMITS.sessionMessages, remainingMessages: LIMITS.sessionMessages } };
        res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(init)); return;
      }
      const body = req.method === "POST" ? validateRequest(await readBody(req)) : null;
      const redis = await redisOperation(() => deps.makeRedis(settings));
      const method = req.method;
      await redisOperation(() => deps.enforceIp(redis, settings, clientKey(req, settings), method));
      let session = readSession(req.headers.cookie, settings.CHAT_SESSION_SECRET);
      const budget = new Budget(redis, settings);
      if (req.method === "GET") {
        if (!session) { const fresh = createSession(settings); session = fresh.session; res.setHeader("Set-Cookie", fresh.cookie); }
        const sessionId = session.id;
        const used = Number(await redisOperation(() => redis.get(`${settings.namespace}:session:${sessionId}`)) ?? 0);
        const available = used < LIMITS.sessionMessages && await redisOperation(() => budget.available());
        if (!available) console.warn(JSON.stringify({ event: "chat_unavailable", code: used >= LIMITS.sessionMessages ? "session_limit" : "budget_exceeded" }));
        const init: ChatInit = { available, limits: { maxMessageChars: LIMITS.messageChars, maxSessionMessages: LIMITS.sessionMessages, remainingMessages: Math.max(0, LIMITS.sessionMessages - used) } };
        res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(init)); return;
      }
      if (!session || !body) throw new ChatError(403, "session_expired", "Tu sesión ha caducado. Recarga la página para comenzar otra.");
      const contactMentioned = body.contactMentioned || body.messages.some(m => m.role === "assistant" && /whatsapp/i.test(m.content));
      const prompt = conversationPrompt(contactMentioned);
      const messages = fitHistory(body.messages, prompt, settings);
      const sessionId = session.id;
      const admission = await redisOperation(() => deps.admitSession(redis, settings, sessionId, body.requestId));
      release = admission.release;
      const question = messages.at(-1)!.content;
      const redirect = medicalRedirect(question, contactMentioned) ?? serviceReply(question);
      if (redirect) {
        begin(); send({ event: "meta", data: { requestId: body.requestId, remainingMessages: admission.remaining } });
        send({ event: "delta", data: { text: redirect } }); send({ event: "done", data: { requestId: body.requestId } });
      } else {
        const reservation = await redisOperation(() => budget.reserve(`${sessionId}:${body.requestId}`));
        if (res.destroyed) { await redisOperation(() => reservation.settle({ input: 0, cached: 0, output: 0 })); return; }
        timer = setTimeout(() => { timedOut = true; abort.abort(); }, LIMITS.timeoutMs);
        const answer = deps.streamAnswer(settings, messages, abort.signal, prompt);
        let complete = false;
        try {
          for await (const part of answer) {
            if (!started && !res.destroyed) { begin(); send({ event: "meta", data: { requestId: body.requestId, remainingMessages: admission.remaining } }); }
            if ("text" in part) send({ event: "delta", data: { text: part.text } });
            if ("usage" in part) await redisOperation(() => reservation.settle(part.usage));
            if ("complete" in part) complete = true;
          }
        } catch (error) {
          // A rejected API request cannot have produced tokens. Transport failures remain reserved.
          if (!started && error instanceof OpenAI.APIError && error.status && error.status >= 400 && error.status < 500) await redisOperation(() => reservation.settle({ input: 0, cached: 0, output: 0 }));
          throw error;
        }
        if (!complete) throw new ChatError(502, "incomplete_response");
        send({ event: "done", data: { requestId: body.requestId } });
      }
    } catch (error) {
      const failure = timedOut ? new ChatError(504, "provider_timeout") : error instanceof ChatError ? error : new ChatError(error instanceof OpenAI.APIError ? 502 : 503, "service_unavailable");
      if (!res.destroyed) {
        if (started) send({ event: "error", data: { code: failure.code, message: failure.message } });
        else { res.statusCode = failure.status; res.setHeader("Content-Type", "application/json"); if (failure.retryAfter) res.setHeader("Retry-After", failure.retryAfter); res.end(JSON.stringify({ error: { code: failure.code, message: failure.message || CHAT_UNAVAILABLE } })); }
      }
      // Do not log exceptions: upstream error objects can contain user content or credentials.
      console.warn(JSON.stringify({ event: "chat_request_failed", code: failure.code }));
    } finally {
      if (timer) clearTimeout(timer);
      abort.abort();
      try { await release?.(); } catch { /* The distributed lock expires after 60 seconds. */ }
      if (!res.writableEnded && !res.destroyed) res.end();
      res.off("close", disconnect);
    }
  };
}

export default createChatHandler();
