// script-discipline.ts — pure detectors for the Script discipline standards.
//
// Shared by `check-script-discipline.ts` (the gate) and
// `test-script-tooling.ts` (the regression self-test). Holds the mechanical
// rules from AGENTS.md §Script discipline for a TS/.mjs body and a shell
// entry point, as pure functions over content so fixtures can assert them.

export const VALID_EXIT: ReadonlySet<string> = new Set(["0", "1", "2"]);

// Allowed shell interpreters (AGENTS.md: sh/bash entry points).
export const ALLOWED_SHEBANGS: ReadonlySet<string> = new Set([
  "#!/usr/bin/env bash",
  "#!/bin/bash",
  "#!/usr/bin/env sh",
  "#!/bin/sh",
]);

// A script header must declare one of the four roles (AGENTS.md §Script
// discipline "Roles"). Compound qualifiers are allowed, e.g.
// `[informational; gate with --gate]`.
export const ROLE_RE = /\[[^\]]*\b(gate|build tool|entry point|informational)\b[^\]]*\]/i;

// Literals assembled so this module's own source does not trip its detectors.
const FILE_URL_PATH = "fileURLToPath" + "(" + "import" + "." + "meta" + "." + "url" + ")";
const URL_PATHNAME = "new" + " URL" + "(" + "import" + "." + "meta" + "." + "url" + ")" + "." + "pathname";

// Extract the leading comment block (shebang + consecutive `//` lines, or the
// first block comment), so the role token is matched in the header only.
export function headerBlock(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length && i < 40; i++) {
    const t = lines[i].trim();
    if (i === 0 && t.startsWith("#!")) continue;
    if (t.startsWith("//")) { out.push(lines[i]); continue; }
    if (t.startsWith("/*")) { out.push(lines[i]); if (t.includes("*/")) break; continue; }
    if (t.startsWith("*")) { out.push(lines[i]); if (t.includes("*/")) break; continue; }
    if (t === "" && out.length === 0) continue;
    break;
  }
  return out.join("\n");
}

// Mechanical rules for a TS/.mjs script body. `rel` is repo-relative for
// messages; `isLib` marks scripts/lib files (shebang and role exempt).
export function contentIssues(rel: string, content: string, isLib: boolean): string[] {
  const issues: string[] = [];
  const lines = content.split("\n");

  if (!isLib && !content.startsWith("#!")) {
    issues.push(`${rel}: missing shebang on first line`);
  }

  const firstReal = lines.findIndex((l) => l.trim() !== "" && !l.trim().startsWith("#!"));
  if (firstReal === -1 || !/^\s*(\/\*\*|\/\*|\/\/)/.test(lines[firstReal] ?? "")) {
    issues.push(`${rel}: missing header comment`);
  } else if (!isLib && !ROLE_RE.test(headerBlock(content))) {
    issues.push(`${rel}: header declares no role — add [gate], [build tool], [entry point], or [informational]`);
  }

  for (const m of content.matchAll(/process\.exit\(\s*(\d+)\s*\)/g)) {
    if (!VALID_EXIT.has(m[1])) {
      issues.push(`${rel}: non-standard exit code ${m[1]} (allowed: 0, 1, 2)`);
    }
  }

  if (/\[\s*["']holonovel["']\s*\]/.test(content)) {
    issues.push(`${rel}: hardcoded server list — import SERVERS from scripts/lib/servers.js`);
  }

  if (content.includes(FILE_URL_PATH) || content.includes(URL_PATHNAME)) {
    issues.push(`${rel}: path resolution — use import.meta.dirname`);
  }

  for (const m of content.matchAll(/catch\s*\{\s*\}/g)) {
    issues.push(`${rel}: empty catch block without a comment explaining why it is safe`);
  }

  return issues;
}

// Mechanical rules for a shell entry point or hook.
export function shellIssues(rel: string, content: string): string[] {
  const issues: string[] = [];
  const lines = content.split("\n");

  const shebang = (lines[0] ?? "").trim();
  if (!shebang.startsWith("#!")) {
    issues.push(`${rel}: missing shebang on first line`);
  } else if (!ALLOWED_SHEBANGS.has(shebang)) {
    issues.push(`${rel}: disallowed shebang '${shebang}' (use #!/usr/bin/env bash or #!/bin/sh)`);
  }

  const firstReal = lines.findIndex((l) => l.trim() !== "" && !l.trim().startsWith("#!"));
  if (firstReal === -1 || !lines[firstReal]!.trim().startsWith("#")) {
    issues.push(`${rel}: missing header comment`);
  }

  if (!content.includes("set -euo pipefail")) {
    issues.push(`${rel}: missing 'set -euo pipefail'`);
  }

  for (const m of content.matchAll(/\bexit\s+(\d+)/g)) {
    if (!VALID_EXIT.has(m[1]!)) {
      issues.push(`${rel}: non-standard exit code ${m[1]} (allowed: 0, 1, 2)`);
    }
  }

  if (/\[\s*["']holonovel["']\s*\]/.test(content)) {
    issues.push(`${rel}: hardcoded server list — read scripts/lib/servers.json`);
  }

  // Colors must be gated on a TTY (AGENTS.md: "color only on TTY"). Heuristic:
  // an ANSI escape or tput with no `-t 0/1` test is unguarded.
  const usesColor = /\\033\[|\\e\[|\\x1b\[/.test(content) || /\btput\b/.test(content);
  const ttyGuarded = /-t\s+[01]|isatty/.test(content);
  if (usesColor && !ttyGuarded) {
    issues.push(`${rel}: color without a TTY guard (add [[ -t 1 ]] or isatty)`);
  }

  return issues;
}
