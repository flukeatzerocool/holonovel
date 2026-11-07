#!/usr/bin/env npx tsx
/**
 * check-roadmap.ts — gate: ROADMAP.md holds scheduled work only. [gate]
 *
 * Role: gate (wired into `check:fast` and `check`). Each `## <title>` section
 * is a scheduled work item: it carries 1–3 bullet lines and a `**Trigger:**`
 * line naming what starts or closes the work. The `## Non-goals` section is a
 * pointer only — no bullets, at most three lines — and must resolve to the
 * stable `## Non-goals` list in `holonovel/DECISIONS.md`, whose every entry
 * cites a governing REQ. Standing facts belong in DECISIONS.md, so this gate
 * stops them accumulating on the roadmap again.
 *
 * Usage: npx tsx scripts/check-roadmap.ts [--json] [--help]
 * Exit codes: 0 = pass, 1 = finding, 2 = fatal.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag, rejectUnknown } from "./lib/args.js";

const ROOT = join(import.meta.dirname, "..");
const ROADMAP = join(ROOT, "ROADMAP.md");
const DECISIONS = join(ROOT, "holonovel", "DECISIONS.md");
const POINTER = "Non-goals";
const MAX_BULLETS = 3;
const MAX_POINTER_LINES = 3;

const USAGE = `check-roadmap — roadmap admission-rule gate

Usage:
  npx tsx scripts/check-roadmap.ts [--json] [--help]

Every \`## <title>\` section in ROADMAP.md must hold 1–${MAX_BULLETS} bullet
lines and a \`**Trigger:**\` line naming what starts or closes the work. The
\`${POINTER}\` section is a pointer only (no bullets, at most ${MAX_POINTER_LINES}
lines) and must resolve to the \`## ${POINTER}\` list in
holonovel/DECISIONS.md, where each entry cites a REQ.

Exit codes: 0 = pass; 1 = finding; 2 = fatal.
`;

interface Finding {
  file: string;
  line: number;
  rule: string;
}

interface Bullet {
  line: number;
  text: string;
}

interface Section {
  title: string;
  line: number;
  body: string[];
  bullets: Bullet[];
  triggers: number[];
}

// Parse sections while ignoring HTML comments and fenced code blocks, so a
// documented example cannot satisfy or violate the rule. A heading shallower
// than `##` (the file title or an `###` subheading) terminates the current
// section, so DECISIONS.md's dated subheadings do not leak into `Non-goals`.
function parseSections(text: string): Section[] {
  const lines = text.split(/\r?\n/);
  const sections: Section[] = [];
  let inComment = false;
  let inFence = false;
  let current: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (inComment) {
      if (line.includes("-->")) inComment = false;
      continue;
    }
    if (line.trimStart().startsWith("<!--")) {
      if (!line.includes("-->")) inComment = true;
      continue;
    }
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = { title: heading[1] ?? "", line: i + 1, body: [], bullets: [], triggers: [] };
      sections.push(current);
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      current = null;
      continue;
    }
    if (!current) continue;

    if (line.trim() !== "") current.body.push(line);
    if (/^-\s+\S/.test(line)) {
      current.bullets.push({ line: i + 1, text: line });
    } else if (/^\s{2,}\S/.test(line) && current.bullets.length > 0) {
      const last = current.bullets[current.bullets.length - 1]!;
      last.text += `\n${line}`;
    }
    if (/^\*\*Trigger:\*\*\s+\S/.test(line)) current.triggers.push(i + 1);
  }

  return sections;
}

function evaluate(roadmap: Section[], decisions: Section[] | null): Finding[] {
  const findings: Finding[] = [];
  const target = decisions?.find((section) => section.title === POINTER) ?? null;

  for (const section of roadmap) {
    if (section.title === POINTER) {
      const body = section.body.map((line) => line.trim()).filter(Boolean);
      if (section.bullets.length > 0) {
        findings.push({
          file: "ROADMAP.md",
          line: section.bullets[0]!.line,
          rule: `"${POINTER}" must be a pointer only — move its entries to holonovel/DECISIONS.md`,
        });
      }
      if (body.length === 0) {
        findings.push({ file: "ROADMAP.md", line: section.line, rule: `"${POINTER}" has no pointer text` });
      } else if (body.length > MAX_POINTER_LINES) {
        findings.push({
          file: "ROADMAP.md",
          line: section.line,
          rule: `"${POINTER}" body is ${body.length} lines — a pointer keeps at most ${MAX_POINTER_LINES}`,
        });
      }
      const text = section.body.join("\n");
      if (!text.includes("DECISIONS.md")) {
        findings.push({ file: "ROADMAP.md", line: section.line, rule: `"${POINTER}" must name holonovel/DECISIONS.md` });
      }
      if (!text.includes(POINTER)) {
        findings.push({
          file: "ROADMAP.md",
          line: section.line,
          rule: `"${POINTER}" must name the DECISIONS.md heading it points at`,
        });
      }
      if (!decisions) {
        findings.push({
          file: "ROADMAP.md",
          line: section.line,
          rule: `cannot resolve the ${POINTER} pointer — holonovel/DECISIONS.md is missing`,
        });
      } else if (!target) {
        findings.push({
          file: "ROADMAP.md",
          line: section.line,
          rule: `cannot resolve the ${POINTER} pointer — holonovel/DECISIONS.md has no "## ${POINTER}" heading`,
        });
      }
      continue;
    }

    if (section.bullets.length === 0) {
      findings.push({
        file: "ROADMAP.md",
        line: section.line,
        rule: `"${section.title}" has no bullet lines — a roadmap item needs 1–${MAX_BULLETS} bullets`,
      });
    } else if (section.bullets.length > MAX_BULLETS) {
      findings.push({
        file: "ROADMAP.md",
        line: section.bullets[MAX_BULLETS]!.line,
        rule: `"${section.title}" has ${section.bullets.length} bullets — the limit is ${MAX_BULLETS}`,
      });
    }

    if (section.triggers.length === 0) {
      findings.push({
        file: "ROADMAP.md",
        line: section.line,
        rule: `"${section.title}" has no \`**Trigger:**\` line — name what starts or closes the work`,
      });
    }
  }

  if (target) {
    if (target.bullets.length === 0) {
      findings.push({
        file: "holonovel/DECISIONS.md",
        line: target.line,
        rule: `"${POINTER}" has no entries — record each out-of-scope track`,
      });
    }
    for (const bullet of target.bullets) {
      if (!/REQ-\d{3}/.test(bullet.text)) {
        findings.push({
          file: "holonovel/DECISIONS.md",
          line: bullet.line,
          rule: `a "${POINTER}" entry cites no REQ — name the governing requirement`,
        });
      }
    }
  }

  return findings;
}

function read(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch {
    // A missing optional input (DECISIONS.md) becomes a pointer finding; a
    // missing required input (ROADMAP.md) is handled by the caller.
    return null;
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--json", "--help", "-h"]), USAGE);
  const json = parseFlag(argv, "--json");

  const roadmapText = read(ROADMAP);
  if (roadmapText === null) {
    console.error(`check-roadmap: cannot read ${ROADMAP}`);
    process.exit(2);
  }
  const decisionsText = read(DECISIONS);

  const roadmap = parseSections(roadmapText);
  const decisions = decisionsText === null ? null : parseSections(decisionsText);
  const findings = evaluate(roadmap, decisions);

  if (json) {
    process.stdout.write(`${JSON.stringify({ file: "ROADMAP.md", sections: roadmap.length, findings }, null, 2)}\n`);
  } else if (findings.length > 0) {
    process.stdout.write(`ROADMAP.md — ${findings.length} finding(s):\n`);
    for (const finding of findings) {
      process.stdout.write(`  ${finding.file}:${finding.line}: ${finding.rule}\n`);
    }
  } else {
    process.stdout.write(`  OK  ROADMAP.md satisfies the admission rule (${roadmap.length} section(s))\n`);
  }

  process.exit(findings.length > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(`check-roadmap: fatal: ${(error as Error).message}`);
  process.exit(2);
}
