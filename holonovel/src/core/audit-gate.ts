// audit-gate.ts — audit-durability rules for the dispatcher.
//
// REQ-040a/REQ-040c — every tool call that mutates Novel state appends a
// chained entry to the audit log. REQ-447 — the log honors a configurable
// maximum entry count, and a call that cannot record its entry is refused
// *before* any state is persisted. The dispatcher owns that refusal because it
// is the one place every transport converges before a handler runs.
//
// The classification source is the committed Tool Surface Contract
// (`tool-surface-registry.json`, REQ-567), whose `mutation_class` is validated
// by `check-tool-surface`. The registry is not authoritative for semantics: a
// handful of actions are classed `read` while their handlers roll dice or
// audit, so `MUTATING_READ_ACTIONS` (owned by `badge-gate.ts`) is consulted
// alongside the class. A key the registry does not carry falls back
// to the tool's registration annotation and fails closed when neither exists.
//
// This is library code, not a script; it has no side effects and no server
// imports.

import { MUTATING_READ_ACTIONS, actionKey } from "./badge-gate.js";
import type { ToolAnnotationsLike } from "./badge-gate.js";
import type { SurfaceRegistryLike } from "./surface-projection.js";

/** REQ-447 — actions admitted at capacity because they are the corrective
 *  action itself: `compact` appends nothing (it opens the REQ-239c
 *  confirmation workflow), and the confirmation is admitted by name in the
 *  dispatcher because it frees space before its own entry is written. */
export const AUDIT_CAP_EXEMPT_ACTIONS: ReadonlySet<string> = new Set([
  "manage_diagnostics.compact",
]);

/** REQ-447 — the most audit entries one call can append: a `REQ-237`
 *  session-boundary marker plus the entry itself, and handlers that record a
 *  second entry (a vow resolution with its linked countdown). The abort
 *  capture is taken only while the log is within this many slots of the cap,
 *  so an uncapped or comfortably sized log pays nothing. */
export const AUDIT_APPEND_HEADROOM = 3;

/** REQ-447 — a call that will append an audit entry. Read-only actions return
 *  false; `MUTATING_READ_ACTIONS` catches the actions the registry mislabels. */
export function appendsAuditEntry(
  registry: SurfaceRegistryLike | null,
  name: string,
  args: Record<string, unknown> | undefined,
  annotations?: ToolAnnotationsLike,
): boolean {
  if (!registry) return annotations?.readOnlyHint === false;
  const key = actionKey(name, args);
  const decl = registry.actions[key];
  if (!decl) {
    // Unregistered (package) tool, or an action the registry does not carry:
    // trust the registration annotation, and fail closed without one.
    return annotations ? annotations.readOnlyHint === false : true;
  }
  return decl.mutation_class !== "read" || MUTATING_READ_ACTIONS.has(key);
}

/** REQ-447 — the refusal text, sharing the handler's corrective action so a
 *  caller sees one wording for one condition. */
export function capacityRefusal(cap: number, corrective: string): string {
  return `[ERROR] [STATE_CONFLICT] Audit log at capacity (${cap} entries). ${corrective}`;
}
