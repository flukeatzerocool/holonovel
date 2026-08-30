#!/usr/bin/env npx tsx
/**
 * cross-property-couple.ts — refresh README and wiki from spec-derived properties. [build tool]
 *
 * Extracts REQ counts, appendix ranges, gate lists, and section counts from
 * the assembled spec and writes them into README.md and the wiki. Exit codes:
 * 0 = refreshed, 1 = a referenced property or command was missing.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { extractH2Headings } from "./lib/parse-spec";

const root = join(import.meta.dirname, "..");

const SPEC_PATH = join(root, "holonovel.md");
const README_PATH = join(root, "README.md");
const WIKI_DIR = join(root, ".holonovel-state", "wiki");
const PKG_PATH = join(root, "package.json");

interface SpecProperties {
  req_count: number;
  line_count: number;
  appendix_range: string;
  main_section_count: number;
  gate_list: string;
  verification_workflow_count: number;
  version: string;
  date: string;
  [key: string]: string | number;
}

function extractProperties(): SpecProperties {
  const spec = readFileSync(SPEC_PATH, "utf-8");
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));

  const reqMatches = [...spec.matchAll(/\*\*REQ-([0-9a-z]+)/gi)];
  const uniqueReqs = new Set(reqMatches.map((m) => m[1]));
  const reqCount = uniqueReqs.size;

  const lines = spec.split("\n");
  const lineCount = lines.length;

  const appendixLetters = [...spec.matchAll(/^## Appendix ([A-Z]):/gm)]
    .map((m) => m[1])
    .sort();
  const appendixRange = appendixLetters.length > 0
    ? `${appendixLetters[0]}–${appendixLetters[appendixLetters.length - 1]}`
    : "none";

  const allH2s = extractH2Headings(spec);
  const mainSections = allH2s.filter((h) =>
    !h.startsWith("Appendix ") && !h.startsWith("Contents")
  );
  const mainSectionCount = mainSections.length;

  const gateMatches = [...spec.matchAll(/\b(G\d+[a-z]?)\b/g)];
  const uniqueGates = new Set(gateMatches.map((m) => m[1]));
  const gatesArray = [...uniqueGates].sort((a, b) => {
    const aNum = parseInt(a.match(/\d+/)?.[0] ?? "0");
    const bNum = parseInt(b.match(/\d+/)?.[0] ?? "0");
    if (aNum !== bNum) return aNum - bNum;
    return (a.match(/[a-z]/)?.[0] ?? "").localeCompare(b.match(/[a-z]/)?.[0] ?? "");
  });
  const gateList = gatesArray.join(", ");
  const verificationWorkflowCount = gatesArray.length;

  const version = pkg.version;
  const date = version.replace(/\./g, "-");

  return {
    req_count: reqCount,
    line_count: lineCount,
    appendix_range: appendixRange,
    main_section_count: mainSectionCount,
    gate_list: gateList,
    verification_workflow_count: verificationWorkflowCount,
    version,
    date,
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function propertyDisplay(name: string, value: string | number): string {
  switch (name) {
    case "line_count":
    case "req_count":
      return formatNumber(Number(value));
    default:
      return String(value);
  }
}

function injectMarkers(filePath: string, props: SpecProperties): boolean {
  const content = readFileSync(filePath, "utf-8");

  const markerRe = /<!--\s*@spec:(\w+)\s*-->/g;
  let changed = false;

  const updated = content.replace(markerRe, (match, propName: string) => {
    if (propName in props) {
      changed = true;
      return propertyDisplay(propName, props[propName]);
    }
    return match;
  });

  if (changed) {
    writeFileSync(filePath, updated);
    const rel = filePath.replace(root + "/", "");
    console.log(`  OK   ${rel}`);
    return true;
  }
  return false;
}

function getWikiPageFiles(): string[] {
  if (!existsSync(WIKI_DIR)) return [];
  return readdirSync(WIKI_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
}

function validateWikiManifest(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const sidebarPath = join(WIKI_DIR, "_Sidebar.md");

  if (!existsSync(sidebarPath)) {
    return { ok: true, issues: [] };
  }

  const sidebar = readFileSync(sidebarPath, "utf-8");
  const pageFiles = getWikiPageFiles();

  const pageNames = pageFiles.map((f) => basename(f, ".md"));

  const sidebarLinks = [...sidebar.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => m[2].replace(/\.md$/, ""));

  const sidebarSet = new Set(sidebarLinks);

  for (const name of pageNames) {
    if (!sidebarSet.has(name)) {
      issues.push(`Wiki page '${name}.md' not listed in _Sidebar.md`);
    }
  }

  for (const link of sidebarLinks) {
    if (link === "https://git.gay/flukeatzerocool/Holonovel") continue;
    if (!pageNames.includes(link)) {
      issues.push(`Sidebar links to '${link}' but no matching .md file found`);
    }
  }

  return { ok: issues.length === 0, issues };
}

function validateReadmeCommandTable(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!existsSync(README_PATH)) {
    return { ok: true, issues: [] };
  }

  const readme = readFileSync(README_PATH, "utf-8");
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
  const pkgScripts = Object.keys(pkg.scripts);

  const tableCmdPattern = /`npm run (\S+)`/g;
  let match: RegExpExecArray | null;
  while ((match = tableCmdPattern.exec(readme)) !== null) {
    const cmd = match[1];
    if (!pkgScripts.includes(cmd)) {
      issues.push(`README references 'npm run ${cmd}' — not found in package.json scripts`);
    }
  }

  return { ok: issues.length === 0, issues };
}

function validateWikiCommandTable(filePath: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!existsSync(filePath)) return { ok: true, issues: [] };

  const content = readFileSync(filePath, "utf-8");
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
  const pkgScripts = Object.keys(pkg.scripts);

  const tableCmdPattern = /`npm run (\S+)`/g;
  let match: RegExpExecArray | null;
  while ((match = tableCmdPattern.exec(content)) !== null) {
    const cmd = match[1];
    if (!pkgScripts.includes(cmd)) {
      issues.push(`${basename(filePath)} references 'npm run ${cmd}' — not found in package.json scripts`);
    }
  }

  return { ok: issues.length === 0, issues };
}

function main(): void {
  const props = extractProperties();
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("=== Spec properties ===\n");

  console.log(`  REQ count:         ${props.req_count}`);
  console.log(`  Line count:        ${props.line_count}`);
  console.log(`  Appendix range:    ${props.appendix_range}`);
  console.log(`  Body sections:     ${props.main_section_count}`);
  console.log(`  Verification gates: ${props.verification_workflow_count} (${props.gate_list})`);
  console.log(`  Version:           ${props.version}`);
  console.log(`  Date:              ${props.date}`);

  console.log("\n=== Injecting markers ===\n");

  if (existsSync(README_PATH)) {
    const changed = injectMarkers(README_PATH, props);
    if (!changed) {
      console.log(`  info  README.md — no markers found`);
    }
  }

  const pageFiles = getWikiPageFiles();
  let wikiChanged = 0;
  for (const file of pageFiles) {
    const fp = join(WIKI_DIR, file);
    if (injectMarkers(fp, props)) wikiChanged++;
  }
  if (wikiChanged === 0) {
    console.log(`  info  wiki/ — no markers found in ${pageFiles.length} pages`);
  }

  console.log("\n=== Wiki manifest validation ===\n");

  const manifest = validateWikiManifest();
  if (manifest.ok) {
    console.log(`  OK   _Sidebar.md: ${getWikiPageFiles().length} pages listed`);
  } else {
    for (const issue of manifest.issues) {
      console.log(`  FAIL  ${issue}`);
      errors.push(issue);
    }
  }

  console.log("\n=== Command table validation ===\n");

  const readmeCmds = validateReadmeCommandTable();
  if (readmeCmds.ok) {
    console.log("  OK   README.md: command references match package.json");
  } else {
    for (const issue of readmeCmds.issues) {
      console.log(`  FAIL  ${issue}`);
      errors.push(issue);
    }
  }

  const specContribPath = join(WIKI_DIR, "Spec-Contributing.md");
  if (existsSync(specContribPath)) {
    const wikiCmds = validateWikiCommandTable(specContribPath);
    if (wikiCmds.ok) {
      console.log("  OK   Spec-Contributing.md: command references match package.json");
    } else {
      for (const issue of wikiCmds.issues) {
        console.log(`  FAIL  ${issue}`);
        errors.push(issue);
      }
    }
  }

  console.log();

  if (errors.length > 0) {
    console.error(`${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }

  console.log(`Cross-property coupling complete. 0 errors.`);
  process.exit(0);
}

main();
