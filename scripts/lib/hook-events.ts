// hook-events.ts — local hook invocation log for the loop audit.
//
// Shared by .githooks/pre-commit, .githooks/pre-push, and scripts/loop-audit.ts.
// Writes one JSON line per hook invocation to .holonovel-state/hook-events.jsonl
// (gitignored local state). The log exists because bypass behaviour is asserted
// by practitioners and never measured: a commit with no matching pre-commit
// event is the observable trace of a skipped hook.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
export const HOOK_EVENTS_PATH = join(ROOT, ".holonovel-state", "hook-events.jsonl");
const CAP = 2000;

export type HookEventName = "pre-commit" | "pre-push";
export type HookAction = "ran" | "skipped" | "failed";

export interface HookEvent {
  at: string;
  event: HookEventName;
  action: HookAction;
  suite?: string;
  head?: string;
}

export function appendHookEvent(event: Omit<HookEvent, "at">): void {
  mkdirSync(join(ROOT, ".holonovel-state"), { recursive: true });
  appendFileSync(HOOK_EVENTS_PATH, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
}

export function readHookEvents(): HookEvent[] {
  if (!existsSync(HOOK_EVENTS_PATH)) return [];
  const lines = readFileSync(HOOK_EVENTS_PATH, "utf-8").split("\n").filter(Boolean);
  const events: HookEvent[] = [];
  for (const line of lines.slice(-CAP)) {
    try {
      events.push(JSON.parse(line) as HookEvent);
    } catch {
      // A truncated final line (interrupted write) is disposable telemetry;
      // skipping it keeps the audit running instead of failing on log damage.
    }
  }
  return events;
}
