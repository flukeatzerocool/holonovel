// Core server helpers — shared MCP boilerplate for all Holonovel servers
// Provides badge gating helpers, error prefixing, and novel/snapshot utilities.

import { StateManager, Badge, NovelState } from "./state.js";

export type ToolCtx = { badge: Badge };
export type ToolHandler = (
  args: any,
  ctx: ToolCtx,
) => Promise<{ content: { type: "text"; text: string }[] }>;

let _state: StateManager;

export function initServer(state: StateManager): void {
  _state = state;
}

export function getBadge(): Badge {
  return _state.activeNovel?.badge ?? "none";
}

export function requireGM(): void {
  _state.requireGM(getBadge());
}

export function requirePlayer(): void {
  _state.requirePlayer(getBadge());
}

export function requireNotObserver(): void {
  _state.requireNotObserver(getBadge());
}

export function requireNovel(): NovelState {
  return _state.requireNovel();
}

export function novelSnapshot(): void {
  const novel = _state.activeNovel;
  if (novel) _state.snapshot(novel, getBadge());
}

export function withForbiddenAudit(
  handler: ToolHandler,
  toolName: string,
): ToolHandler {
  // REQ-133 — forbidden-call audit: every [FORBIDDEN] is recorded with the
  // active badge, tool name, and arguments, tagged `violation_type: boundary`
  // (see StateManager.auditForbidden) and surfaced with a [BOUNDARY_VIOLATION]
  // marker in compress_audit / audit://novel.
  return async (args: any, ctx: ToolCtx) => {
    try {
      const result = await handler(args, ctx);
      // Handlers may return the forbidden envelope instead of throwing it;
      // REQ-133a requires either form to reach the boundary audit exactly once.
      const text = (result?.content ?? [])
        .map((part: any) => part?.text ?? "")
        .join("\n");
      // Only the envelope's first non-empty line can carry a refusal marker; a
      // success payload that merely quotes `[FORBIDDEN]` must not be audited.
      const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
      const category = (result as any)?.structuredContent?.category;
      const status = (result as any)?.structuredContent?.status;
      // A refusal marker on an OK envelope is quoted content, not a refusal.
      const markedRefusal = /^\s*(\[ERROR\]\s*)?\[FORBIDDEN\]/.test(firstLine) && status !== "OK";
      if (category === "FORBIDDEN" || markedRefusal) {
        _state.auditForbidden(ctx.badge, toolName, args);
      }
      return result;
    } catch (e: any) {
      if (e.message?.startsWith("[FORBIDDEN]")) {
        _state.auditForbidden(ctx.badge, toolName, args);
      }
      throw e;
    }
  };
}
