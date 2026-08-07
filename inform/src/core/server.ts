// Core server helpers — shared MCP boilerplate for all Holonovel servers
// Provides hat gating helpers, error prefixing, and novel/snapshot utilities.

import { StateManager, Hat, NovelState } from "./state.js";

export type ToolCtx = { hat: Hat };
export type ToolHandler = (
  args: any,
  ctx: ToolCtx,
) => Promise<{ content: { type: "text"; text: string }[] }>;

let _state: StateManager;

export function initServer(state: StateManager): void {
  _state = state;
}

export function getHat(): Hat {
  return _state.activeNovel?.hat ?? null;
}

export function requireGM(): void {
  _state.requireGM(getHat());
}

export function requirePlayer(): void {
  _state.requirePlayer(getHat());
}

export function requireNovel(): NovelState {
  return _state.requireNovel();
}

export function novelSnapshot(): void {
  const novel = _state.activeNovel;
  if (novel) _state.snapshot(novel, getHat());
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
        _state.auditForbidden(ctx.hat, toolName, args);
      }
      throw e;
    }
  };
}
