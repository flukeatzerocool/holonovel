// spec-update.ts — helpers for the DECISIONS.md Spec Update record.
//
// Shared by spec-update-record.ts (the --check gate) and its self-tests, so the
// "verification line was never filled" predicate has one implementation.

const PLACEHOLDER = /^_?fill after running the gates/i;

export function isPlaceholderVerification(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return true;
  return PLACEHOLDER.test(trimmed);
}

function entrySlice(decisions: string, start: number): string {
  const rest = decisions.slice(start);
  const next = rest.indexOf("\n### ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

// The entry for the current hash (via its @spec-update marker), falling back to
// today's heading when a hand-edited entry lacks the marker.
export function entryFor(decisions: string, specHash: string, today: string): string | null {
  const marker = decisions.indexOf(`@spec-update:${specHash}`);
  if (marker !== -1) {
    const before = decisions.slice(0, marker);
    const heading = before.lastIndexOf("### Holonovel Spec Update — ");
    return heading === -1 ? null : entrySlice(decisions, heading);
  }
  const heading = decisions.indexOf(`### Holonovel Spec Update — ${today}`);
  return heading === -1 ? null : entrySlice(decisions, heading);
}

export function verificationLine(entry: string): string | null {
  const match = entry.match(/^\s*-\s+\*\*Verification:\*\*\s*(.*)$/m);
  return match ? match[1] : null;
}

export function hasUnfilledVerification(decisions: string, specHash: string, today: string): boolean {
  const entry = entryFor(decisions, specHash, today);
  if (entry === null) return false;
  const line = verificationLine(entry);
  return line === null || isPlaceholderVerification(line);
}
