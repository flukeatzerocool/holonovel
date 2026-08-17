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
  return async (args: any, ctx: ToolCtx) => {
    try {
      return await handler(args, ctx);
    } catch (e: any) {
      if (e.message?.startsWith("[FORBIDDEN]")) {
        _state.auditForbidden(ctx.badge, toolName, args);
      }
      throw e;
    }
  };
}
