import { CHAT_UNAVAILABLE } from "../../shared/chat.js";

export class ChatError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfter?: number;
  constructor(status: number, code: string, message = CHAT_UNAVAILABLE, retryAfter?: number) {
    super(message); this.status = status; this.code = code; this.retryAfter = retryAfter;
  }
}
