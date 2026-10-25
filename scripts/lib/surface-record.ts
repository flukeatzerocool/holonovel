// Parse the human-readable recorded budgets in holonovel/DECISIONS.md.
// Shared by scripts/surface-budget.ts (gate) and scripts/test-spec-tooling.ts
// (self-tests), so the DECISIONS ↔ baseline agreement rule stays under test.

export interface RecordedBudgets {
  canonical: number;
  compatibility: number;
  full: number;
  standard: number;
  small: number;
}

export function parseRecordedBudgets(md: string): RecordedBudgets | null {
  const tool = md.match(
    /\*\*Recorded tool budget:\*\*\s*\d+ listed \((\d+) canonical actions;.*?(\d+) tombstone declarations\)/,
  );
  const surface = md.match(
    /\*\*Recorded surface budgets:\*\*\s*full ([\d,]+) tokens; standard ([\d,]+); small ([\d,]+);/,
  );
  if (!tool || !surface) return null;
  const n = (value: string) => parseInt(value.replace(/,/g, ""), 10);
  return {
    canonical: n(tool[1]),
    compatibility: n(tool[2]),
    full: n(surface[1]),
    standard: n(surface[2]),
    small: n(surface[3]),
  };
}
