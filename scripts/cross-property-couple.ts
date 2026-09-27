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
import { extractH2Headings, extractReqBodies } from "./lib/parse-spec";
import { handleHelp, parseFlag } from "./lib/args.js";

const root = join(import.meta.dirname, "..");

const SPEC_PATH = join(root, "holonovel.md");
const README_PATH = join(root, "README.md");
const WIKI_DIR = join(root, ".holonovel-state", "wiki");
const PKG_PATH = join(root, "package.json");
const SERVER_AGENTS_PATH = join(root, "holonovel", "AGENTS.md");

interface SpecProperties {
  req_count: number;
  line_count: number;
  appendix_range: string;
  main_section_count: number;
  gate_list: string;
  verification_workflow_count: number;
  version: string;
  date: string;
  tool_count: number;
  resource_count: number;
  prompt_count: number;
  [key: string]: string | number;
}

// Parse the T511-gated tool-surface line from holonovel/AGENTS.md
// ("McpServer: 28 action-discriminator tools, ~22 resources, 5 prompts").
// Returns zeros when the line is absent or unparseable, so the wiki renders
// nothing rather than a stale hand-written number.
function extractServerSurface(): { tool_count: number; resource_count: number; prompt_count: number } {
  const zero = { tool_count: 0, resource_count: 0, prompt_count: 0 };
  if (!existsSync(SERVER_AGENTS_PATH)) return zero;
  const text = readFileSync(SERVER_AGENTS_PATH, "utf-8");
  const m = text.match(
    /(\d+)\s+action-discriminator tools,\s*~?(\d+)\s+resources(?:\s+and\s+\d+\s+resource templates)?,\s*(\d+)\s+prompts/
  );
  if (!m) return zero;
  return { tool_count: Number(m[1]), resource_count: Number(m[2]), prompt_count: Number(m[3]) };
}

function extractProperties(): SpecProperties {
  const spec = readFileSync(SPEC_PATH, "utf-8");
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));

  const reqCount = new Set(
    [...extractReqBodies(spec).keys()].map((id) => id.replace(/[a-z]\d*$/, ""))
  ).size;
  const surface = extractServerSurface();

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
    tool_count: surface.tool_count,
    resource_count: surface.resource_count,
    prompt_count: surface.prompt_count,
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

// Value-token grammar per property. Alternation order matters: gate_list and
// appendix_range precede the bare numeric token so their leading characters
// (G, A–Z) are not swallowed by `\d[\d,]*`; date and version precede numeric so
// a version string like 2026.09.04 is not truncated at the first dot.
const VALUE_TOKEN =
  `G\\d+[a-z]?(?:,\\s*G\\d+[a-z]?)*` +
  `|[A-Z]–[A-Z]` +
  `|\\d{4}-\\d{2}-\\d{2}` +
  `|\\d+\\.\\d+\\.\\d+` +
  `|\\d[\\d,]*`;

const MARKER_PATTERN = `<!--\\s*@spec:(\\w+)\\s*-->( ?)((?:${VALUE_TOKEN}))?`;

// Compare the marker values in a file against the expected property values
// without writing. Used by --check to fail when a marker has drifted from the
// spec-derived value (e.g. a hand-edited README date).
function findStaleMarkers(
  filePath: string,
  props: SpecProperties
): { prop: string; expected: string; actual: string | undefined }[] {
  const content = readFileSync(filePath, "utf-8");
  const stale: { prop: string; expected: string; actual: string | undefined }[] = [];
  for (const m of content.matchAll(new RegExp(MARKER_PATTERN, "g"))) {
    const propName = m[1];
    if (!(propName in props)) continue;
    const expected = propertyDisplay(propName, props[propName]);
    if (m[3] !== expected) stale.push({ prop: propName, expected, actual: m[3] });
  }
  return stale;
}

// Idempotent marker injection. A marker `<!-- @spec:NAME -->` persists; the
// value lives immediately after it. On first injection the value is inserted
// between the marker and the following prose; on later runs the existing value
// (captured by the grammar above) is swapped only when it differs, so repeated
// pipeline runs produce no churn. The single optional space between `-->` and
// the value (present in the hand-authored template, absent once injected) is
// preserved so inline prose stays correctly spaced.
function injectMarkers(filePath: string, props: SpecProperties): { changed: boolean; matched: boolean } {
  const content = readFileSync(filePath, "utf-8");

  const markerRe = new RegExp(MARKER_PATTERN, "g");
  let changed = false;
  let matched = false;

  const updated = content.replace(markerRe, (match, propName: string, gap: string, existing?: string) => {
    matched = true;
    if (!(propName in props)) return match;
    const value = propertyDisplay(propName, props[propName]);
    if (existing === value) return match;
    changed = true;
    return `<!-- @spec:${propName} -->${value}${gap}`;
  });

  if (changed) {
    writeFileSync(filePath, updated);
    const rel = filePath.replace(root + "/", "");
    console.log(`  OK   ${rel}`);
  }
  return { changed, matched };
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

const USAGE = `Usage: npx tsx scripts/cross-property-couple.ts [--check] [--include-wiki]

  --check         Verify @spec markers match the spec-derived values; report
                  drift and exit 1 without writing.
  --include-wiki  Also check wiki pages under .holonovel-state/wiki (off by
                  default: the wiki is a separate repo the push pipeline
                  refreshes, so it is not a commit-gate surface).
  --help, -h      Show this message.

Exit codes: 0 = refreshed / markers fresh, 1 = a property, command, or marker
was missing or stale.
`;

function main(): void {
  handleHelp(process.argv, USAGE);
  const checkMode = parseFlag(process.argv, "--check");
  const includeWiki = parseFlag(process.argv, "--include-wiki");
  const props = extractProperties();
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("=== Spec properties ===\n");

  console.log(`  REQ count:         ${props.req_count}`);
  console.log(`  Line count:        ${props.line_count}`);
  console.log(`  Appendix range:    ${props.appendix_range}`);
  console.log(`  Body sections:     ${props.main_section_count}`);
  console.log(`  Verification gates: ${props.verification_workflow_count} (${props.gate_list})`);
  console.log(`  Tool surface:      ${props.tool_count} tools, ${props.resource_count} resources, ${props.prompt_count} prompts`);
  console.log(`  Version:           ${props.version}`);
  console.log(`  Date:              ${props.date}`);

  if (checkMode) {
    console.log("\n=== Checking markers ===\n");
    const wikiFiles = includeWiki ? getWikiPageFiles().map((f) => join(WIKI_DIR, f)) : [];
    const filesToCheck = [README_PATH, ...wikiFiles].filter(existsSync);
    for (const fp of filesToCheck) {
      for (const s of findStaleMarkers(fp, props)) {
        console.log(
          `  STALE  ${fp.replace(root + "/", "")}: @spec:${s.prop} = ${s.actual ?? "(missing)"}, expected ${s.expected}`
        );
        errors.push(`stale @spec:${s.prop} in ${fp}`);
      }
    }
    if (errors.length === 0) {
      console.log(`  OK   ${filesToCheck.length} file(s): all @spec markers match`);
      process.exit(0);
    }
    console.log(`\n${errors.length} stale marker(s). Run \`npm run refresh-properties\` to update.`);
    process.exit(1);
  }

  console.log("\n=== Injecting markers ===\n");

  if (existsSync(README_PATH)) {
    const r = injectMarkers(README_PATH, props);
    if (!r.matched) {
      console.log(`  info  README.md — no markers found`);
    } else if (!r.changed) {
      console.log(`  info  README.md — markers up to date`);
    }
  }

  const pageFiles = getWikiPageFiles();
  let wikiChanged = 0;
  let wikiMatched = 0;
  for (const file of pageFiles) {
    const fp = join(WIKI_DIR, file);
    const r = injectMarkers(fp, props);
    if (r.changed) wikiChanged++;
    if (r.matched) wikiMatched++;
  }
  if (wikiMatched === 0) {
    console.log(`  info  wiki/ — no markers found in ${pageFiles.length} pages`);
  } else if (wikiChanged === 0) {
    console.log(`  info  wiki/ — markers up to date in ${wikiMatched} pages`);
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
