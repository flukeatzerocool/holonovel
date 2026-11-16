/**
 * loop-bounds.ts — measure the increment artifact bound (ROADMAP item 6).
 *
 * Purpose: cap the size of the working record. A plan names its own done bar and
 * a verification path, so length is a proxy for the session's ability to hold
 * the increment in one context. The bound applies from a `since` date so the
 * historical corpus is not rewritten; a short exemption list covers increments
 * that predate the gate on that date.
 *
 * Pure: the caller reads the baseline file and supplies the text.
 */

export const PLAN_LIMIT = 150;
export const AAR_LIMIT = 120;

export interface IncrementSize {
  name: string;
  planLines: number;
  aarLines: number;
}

export interface BoundBaseline {
  since: string;
  exempt: string[];
}

export interface Overage {
  increment: string;
  field: "plan" | "aar";
  lines: number;
  limit: number;
}

export type BaselineRead =
  | { status: "absent" }
  | { status: "malformed"; reason: string }
  | { status: "ok"; baseline: BoundBaseline };

/** Lines in a file's text, with a single trailing newline not counted. */
export function countLines(text: string): number {
  if (text === "") return 0;
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines.length;
}

/**
 * Validate the baseline JSON. Absent and malformed are distinct: absence is a
 * normal first-run state (the report says so and exempts nothing), while an
 * unparseable file is an error — silently disabling the bound is the failure
 * mode this function exists to prevent.
 */
export function parseBaseline(text: string | null): BaselineRead {
  if (text === null) return { status: "absent" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // The syntax error is not actionable at this level; the caller reports the path.
    return { status: "malformed", reason: "not valid JSON" };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { status: "malformed", reason: "not a JSON object" };
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.since !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(record.since)) {
    return { status: "malformed", reason: "'since' must be a YYYY-MM-DD string" };
  }
  if (!Array.isArray(record.exempt) || record.exempt.some((item) => typeof item !== "string")) {
    return { status: "malformed", reason: "'exempt' must be an array of increment names" };
  }
  return { status: "ok", baseline: { since: record.since, exempt: record.exempt as string[] } };
}

/** The increment's date prefix, or "" when the directory is not date-named. */
export function incrementDate(name: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(name) ? name.slice(0, 10) : "";
}

/**
 * Every increment dated on or after `since` that exceeds a limit and is not
 * exempt. An increment dated before `since`, or with no date prefix, is out of
 * scope — the bound is forward-looking.
 */
export function artifactOverage(
  increments: readonly IncrementSize[],
  baseline: BoundBaseline,
): Overage[] {
  const exemptions = new Set(baseline.exempt);
  const overages: Overage[] = [];
  for (const increment of increments) {
    const date = incrementDate(increment.name);
    if (date === "" || date < baseline.since) continue;
    if (exemptions.has(increment.name)) continue;
    if (increment.planLines > PLAN_LIMIT) {
      overages.push({ increment: increment.name, field: "plan", lines: increment.planLines, limit: PLAN_LIMIT });
    }
    if (increment.aarLines > AAR_LIMIT) {
      overages.push({ increment: increment.name, field: "aar", lines: increment.aarLines, limit: AAR_LIMIT });
    }
  }
  return overages.sort((a, b) => a.increment.localeCompare(b.increment) || a.field.localeCompare(b.field));
}
