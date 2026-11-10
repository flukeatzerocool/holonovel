// tool-budget.ts — recorded tool-surface budgets from holonovel/DECISIONS.md.
//
// REQ-024c / REQ-392: the description-size budget recorded in DECISIONS.md is
// the single source of truth, so harnesses read it rather than hardcoding a
// byte count. Exported here so the static catalog check (T642) and the
// live-registry check (T459) share one parser instead of carrying duplicate
// copies (check-script-quality C2).
//
// Exit codes: none — this module throws on a missing record; the importing
// harness owns the exit status.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..");

/** REQ-024c/REQ-392 — the recorded per-description byte budget. */
export function recordedDescriptionBudget(): number {
  const md = readFileSync(join(ROOT, "holonovel", "DECISIONS.md"), "utf-8");
  const m = md.match(/\*\*Recorded description budget:\*\*\s*(\d+)/);
  if (!m) throw new Error("DECISIONS.md is missing the REQ-024c 'Recorded description budget' line");
  return parseInt(m[1], 10);
}
