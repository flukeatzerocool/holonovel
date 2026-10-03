#!/usr/bin/env npx tsx
/**
 * check-script-discipline.ts — enforce the Script discipline standards. [gate]
 *
 * Verifies the mechanical rules from the AGENTS.md "Script discipline"
 * section across scripts/ and holonovel/scripts/. Exit codes: 0 = all pass,
 * 1 = one or more violations.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { walkFiles, walkTsFiles } from "./lib/walk.js";

const ROOT = join(import.meta.dirname, "..");
const DIRS = [join(ROOT, "scripts"), join(ROOT, "holonovel", "scripts")];
const LIB_DIRS = [join(ROOT, "scripts", "lib"), join(ROOT, "holonovel", "scripts", "lib")];
// Shell discipline applies to entry points and hooks (AGENTS.md §Script
// discipline). `.opencode/` agent tooling is deliberately out of scope.
const SHELL_DIRS = [join(ROOT, "scripts"), join(ROOT, ".githooks")];

const issues: string[] = [];
const VALID_EXIT = new Set(["0", "1", "2"]);

// Allowed shell interpreters (AGENTS.md: sh/bash entry points).
const ALLOWED_SHEBANGS = new Set([
  "#!/usr/bin/env bash",
  "#!/bin/bash",
  "#!/usr/bin/env sh",
  "#!/bin/sh",
]);

// A script header must declare one of the four roles (AGENTS.md §Script
// discipline "Roles"). Compound qualifiers are allowed, e.g.
// `[informational; gate with --gate]`.
const ROLE_RE = /\[[^\]]*\b(gate|build tool|entry point|informational)\b[^\]]*\]/i;

// Extract the leading comment block (shebang + consecutive `//` lines, or the
// first block comment), so the role token is matched in the header only.
function headerBlock(content: string): string {
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

function checkShellFile(file: string): void {
  const rel = file.slice(ROOT.length + 1);
  const content = readFileSync(file, "utf-8");
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
}

for (const dir of SHELL_DIRS) {
  for (const file of walkFiles(dir, ".sh")) {
    checkShellFile(file);
  }
}
// .githooks/ files have no .sh extension.
for (const file of walkFiles(join(ROOT, ".githooks"), "")) {
  if (/[/\\]pre-(commit|push)$/.test(file)) checkShellFile(file);
}

// Literals assembled to keep this file's own source from tripping its own
// detectors.
const FILE_URL_PATH = "fileURLToPath" + "(" + "import" + "." + "meta" + "." + "url" + ")";
const URL_PATHNAME = "new" + " URL" + "(" + "import" + "." + "meta" + "." + "url" + ")" + "." + "pathname";

for (const dir of DIRS) {
  for (const file of walkTsFiles(dir)) {
    const rel = file.slice(ROOT.length + 1);
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    const isLib = LIB_DIRS.some((d) => file.startsWith(d));

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
  }
}

if (issues.length > 0) {
  for (const issue of issues) console.error(`FAIL: ${issue}`);
  console.error(`\n${issues.length} script-discipline violation(s)`);
  process.exit(1);
}

console.log(`PASS: script discipline — ${DIRS.length} TS trees + shell entry points, no violations`);
process.exit(0);
