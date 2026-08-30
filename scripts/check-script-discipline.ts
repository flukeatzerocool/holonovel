#!/usr/bin/env npx tsx
/**
 * check-script-discipline.ts — enforce the Script discipline standards. [gate]
 *
 * Verifies the mechanical rules from the AGENTS.md "Script discipline"
 * section across scripts/ and holonovel/scripts/. Exit codes: 0 = all pass,
 * 1 = one or more violations.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const DIRS = [join(ROOT, "scripts"), join(ROOT, "holonovel", "scripts")];
const LIB_DIR = join(ROOT, "scripts", "lib");

const issues: string[] = [];

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkTsFiles(p));
    else if (e.isFile() && e.name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const VALID_EXIT = new Set(["0", "1", "2"]);

// Literals assembled to keep this file's own source from tripping its own
// detectors.
const FILE_URL_PATH = "fileURLToPath" + "(" + "import" + "." + "meta" + "." + "url" + ")";
const URL_PATHNAME = "new" + " URL" + "(" + "import" + "." + "meta" + "." + "url" + ")" + "." + "pathname";

for (const dir of DIRS) {
  for (const file of walkTsFiles(dir)) {
    const rel = file.slice(ROOT.length + 1);
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    const isLib = file.startsWith(LIB_DIR);

    if (!isLib && !content.startsWith("#!")) {
      issues.push(`${rel}: missing shebang on first line`);
    }

    const firstReal = lines.findIndex((l) => l.trim() !== "" && !l.trim().startsWith("#!"));
    if (firstReal === -1 || !/^\s*(\/\*\*|\/\*|\/\/)/.test(lines[firstReal] ?? "")) {
      issues.push(`${rel}: missing header comment`);
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

console.log(`PASS: script discipline — ${DIRS.length} trees, no violations`);
process.exit(0);
