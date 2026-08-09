#!/usr/bin/env node
// Build Index — Extract and index ruleset Markdown files into structured data
// Gate 0 verification: structural integrity of ruleset

import * as fs from "fs";
import * as path from "path";

const RULESET_DIR = path.join(process.cwd(), "ruleset");
const GENERATED_DIR = path.join(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "..", "src", "generated");

function walkDir(dir: string, ext: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  console.error("Building ruleset index...");

  if (!fs.existsSync(RULESET_DIR)) {
    console.error(`Ruleset directory not found: ${RULESET_DIR}`);
    process.exit(1);
  }

  const files = walkDir(RULESET_DIR, ".md");
  console.error(`Found ${files.length} Markdown files`);

  // Ensure generated directory exists
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  // Index metadata
  const index: { path: string; relative: string; headings: string[]; size: number }[] = [];

  for (const file of files) {
    const relative = path.relative(RULESET_DIR, file);
    const content = fs.readFileSync(file, "utf-8");
    const headings: string[] = [];

    for (const line of content.split("\n")) {
      const m = line.match(/^#{2,3}\s+(.+)$/);
      if (m) headings.push(m[1].trim());
    }

    index.push({ path: file, relative, headings, size: content.length });
  }

  fs.writeFileSync(path.join(GENERATED_DIR, "index.json"), JSON.stringify(index, null, 2));
  console.error(`Index written: ${index.length} files`);
  console.error(`Total headings: ${index.reduce((sum, f) => sum + f.headings.length, 0)}`);
}

main();
