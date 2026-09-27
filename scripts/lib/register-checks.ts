// register-checks.ts — pure parsers for the review and proofread registers.
//
// Shared by scripts/check-registers.ts (gate) and scripts/test-req-checks.ts
// (self-tests), so the register structure rules stay under test.

export const DISPOSITIONS = [
  /^## Resolved\b/,
  /^## Scheduled-roadmap\b/,
  /^## Closed-P3\b/,
  /^## Deferred-by-user\b/,
];

export const PROOF_DISPOSITIONS = /^(Fixed|Accepted|Open|Deferred)\b/;

export interface Finding {
  section: string;
  text: string;
}

// A finding is a `- **…**` bullet plus its indented continuation lines. Parse
// whole findings, not just the first line, so a date or commit ref on a
// continuation line counts.
export function parseFindings(content: string): Finding[] {
  const findings: Finding[] = [];
  let section = "preamble";
  let current: string[] | null = null;
  const flush = () => {
    if (current) findings.push({ section, text: current.join("\n") });
    current = null;
  };
  for (const line of content.split("\n")) {
    const h = line.match(/^## (.+)$/);
    if (h) {
      flush();
      section = DISPOSITIONS.find((re) => re.test(line)) ? h[1] : "unknown";
      continue;
    }
    if (/^- /.test(line)) {
      flush();
      current = [line];
      continue;
    }
    if (current && (/^\s/.test(line) || line.trim() === "")) {
      current.push(line);
      continue;
    }
    flush();
  }
  flush();
  return findings;
}

export function checkReviewFindings(findings: Finding[], roadmap: string): string[] {
  const issues: string[] = [];
  let undated = 0;
  for (const f of findings) {
    if (f.section === "unknown" || f.section === "preamble") {
      issues.push(`finding outside a disposition section: ${f.text.slice(0, 70)}…`);
      continue;
    }
    if (!/\d{4}-\d{2}-\d{2}/.test(f.text) && !/`[a-f0-9]{7,}`/.test(f.text)) {
      undated++;
    }
    if (f.section.startsWith("Scheduled-roadmap") && roadmap) {
      for (const req of [...f.text.matchAll(/\bREQ-\d{3}[a-z0-9]*/g)].map((m) => m[0])) {
        if (!roadmap.includes(req)) {
          issues.push(`Scheduled-roadmap finding cites ${req} but ROADMAP.md has no matching entry`);
        }
      }
    }
  }
  // Grandfathered entries predate the date/commit-citation convention; report
  // the count, not each entry, so the signal does not flood the gate output.
  if (undated > 0) {
    issues.push(`INFO: ${undated} grandfathered finding(s) lack a date/commit reference (new findings must cite one)`);
  }
  return issues;
}

// The finding ledger is a `| PR-n | … | … | Disposition |` table. The
// disposition is the last populated cell.
export function checkProofreadDispositions(content: string): string[] {
  const issues: string[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^\|\s*(PR-\d+)\s*\|/);
    if (!m) continue;
    const cells = line.split("|").map((c) => c.trim());
    const disposition = cells[cells.length - 2] ?? "";
    if (!PROOF_DISPOSITIONS.test(disposition)) {
      issues.push(`${m[1]}: disposition "${disposition.slice(0, 40)}" is not Fixed/Accepted/Open/Deferred`);
    }
  }
  return issues;
}
