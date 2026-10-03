#!/usr/bin/env npx tsx
/**
 * compare-spec-code.ts — spec-to-code conformance evidence map. [informational;
 * gate with --gate]
 *
 * Joins the assembled spec's REQ bodies, the committed coverage register
 * (`spec/audit/req-coverage.md`), the server source's REQ citation sites
 * (holonovel/src + holonovel/scripts), the Appendix F test map, the §6.6
 * sub-workflow map, and the harness `test("<name>")` bodies into a per-REQ
 * dossier for the full spec↔code comparison. Read-only; mutates nothing in the
 * spec or server source.
 *
 * Usage:
 *   npx tsx scripts/compare-spec-code.ts [--section 5.1] [--out FILE]
 *                                        [--json FILE] [--check] [--bundles] [--help]
 *
 * Exit codes: 0 = dossier produced / --gate clean, 1 = --gate failure, 2 = fatal
 * unexpected error.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { readSpec, extractReqBodies } from "./lib/parse-spec.js";
import { walkTsFiles } from "./lib/walk.js";
import { parseSubworkflowMap } from "./lib/subworkflow.js";
import { parseFlag, parseValueFlag, handleHelp } from "./lib/args.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMPL_SRC_DIR = path.join(ROOT, "holonovel", "src");
const IMPL_SCRIPTS_DIR = path.join(ROOT, "holonovel", "scripts");
const REGISTER_PATH = path.join(ROOT, "spec", "audit", "req-coverage.md");

interface RegisterRow {
  reqId: string;
  title: string;
  section: string;
  bucket: "A" | "B" | "C" | "D" | "E";
  exercisedTests: string[];
  disposition: string;
}

interface CiteSite {
  file: string;
  line: number;
  text: string;
  isComment: boolean;
}

interface TestBody {
  file: string;
  name: string;
  snippet: string;
}

// An executed `test("<name>", ...)` call, its leading (prefix) identifiers, and
// every [TIS] identifier the whole name carries. Used to measure how far a
// bundled name is the sole evidence for a REQ (bundle-dependency report).
interface TestNameEntry {
  file: string;
  name: string;
  prefixIds: string[];
  allIds: string[];
}

const MAX_IDS_PER_TEST_NAME = 4;

function gatherTestNames(): TestNameEntry[] {
  const out: TestNameEntry[] = [];
  for (const f of walkTsFiles(IMPL_SCRIPTS_DIR)) {
    let content = "";
    try { content = fs.readFileSync(f, "utf-8"); } catch { continue; }
    for (const m of content.matchAll(/\btest\s*\(\s*["'`]([^"'`]+)["'`]/g)) {
      const name = m[1];
      const colon = name.indexOf(":");
      const prefix = colon === -1 ? name : name.slice(0, colon);
      out.push({
        file: rel(f),
        name,
        prefixIds: [...prefix.matchAll(/\b([TIS]\d+[a-z0-9]*)\b/g)].map((x) => x[1]),
        allIds: [...name.matchAll(/\b([TIS]\d+[a-z0-9]*)\b/g)].map((x) => x[1]),
      });
    }
  }
  return out;
}

function baseReq(reqId: string): string {
  const m = reqId.match(/^REQ-\d{3}/);
  return m ? m[0] : reqId;
}

function rel(p: string): string {
  return path.relative(ROOT, p);
}

function parseRegister(): Map<string, RegisterRow> {
  const rows = new Map<string, RegisterRow>();
  let content = "";
  try { content = fs.readFileSync(REGISTER_PATH, "utf-8"); } catch { return rows; }
  for (const line of content.split("\n")) {
    const m = line.match(/^\|\s*(REQ-\d{3})\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([A-E])\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/);
    if (!m) continue;
    rows.set(m[1], {
      reqId: m[1],
      title: m[2],
      section: m[3],
      bucket: m[4] as RegisterRow["bucket"],
      exercisedTests: m[5] === "—" ? [] : m[5].split(",").map((s) => s.trim()).filter(Boolean),
      disposition: m[6] === "—" ? "" : m[6],
    });
  }
  return rows;
}

// Same walk and regex as validate.ts gatherSourceCites, extended with line
// numbers and comment detection for the weak-citation signal.
function gatherCiteSites(): Map<string, CiteSite[]> {
  const map = new Map<string, CiteSite[]>();
  const dirs = [IMPL_SRC_DIR, IMPL_SCRIPTS_DIR];
  for (const dir of dirs) {
    for (const f of walkTsFiles(dir)) {
      let content = "";
      try { content = fs.readFileSync(f, "utf-8"); } catch { continue; }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const m of lines[i].matchAll(/\bREQ-(\d{3}[a-z0-9]*)\b/g)) {
          const id = "REQ-" + m[1];
          if (!map.has(id)) map.set(id, []);
          map.get(id)!.push({ file: rel(f), line: i + 1, text: lines[i].trim().slice(0, 140), isComment: /^\s*(\/\/|\*|\/\*)/.test(lines[i]) });
        }
      }
    }
  }
  return map;
}

// Same walk and regex as validate.ts gatherExercisedIds, extended to capture
// the `test(...)` call's leading body as the assertion snippet.
function gatherTestBodies(): Map<string, TestBody[]> {
  const map = new Map<string, TestBody[]>();
  for (const f of walkTsFiles(IMPL_SCRIPTS_DIR)) {
    let content = "";
    try { content = fs.readFileSync(f, "utf-8"); } catch { continue; }
    for (const m of content.matchAll(/\btest\s*\(\s*["'`]([^"'`]+)["'`]/g)) {
      const idx = m.index ?? 0;
      const snippet = content.slice(idx, idx + 520).split("\n").slice(0, 9).join("\n");
      for (const idm of m[1].matchAll(/\b([TIS]\d+[a-z0-9]*)\b/g)) {
        const id = idm[1];
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push({ file: rel(f), name: m[1], snippet });
      }
    }
  }
  return map;
}

// Appendix F test table: `| T3 | Manual | <desc> | REQ-024, REQ-021 |`.
function parseAppendixFReqTests(text: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const [tid, entry] of parseAppendixF(text)) {
    for (const r of entry.reqs) {
      if (!map.has(r)) map.set(r, new Set());
      map.get(r)!.add(tid);
    }
  }
  return map;
}

interface AppFEntry {
  title: string;
  reqs: string[];
}

// Appendix F entry title is the text before the first colon in the Test cell
// (e.g. "Result count reporting: search ..." → "Result count reporting").
function parseAppendixF(text: string): Map<string, AppFEntry> {
  const map = new Map<string, AppFEntry>();
  const start = text.indexOf("| #     | Type     | Test");
  if (start === -1) return map;
  const end = text.indexOf("\n##", start + 1);
  const slice = end === -1 ? text.slice(start) : text.slice(start, end);
  for (const line of slice.split("\n")) {
    const m = line.match(/^\|\s*(T\d+[a-z0-9]*)\s+\|[^|]*\|(.*)\|\s*([^|\n]+)\s*\|$/);
    if (!m) continue;
    const desc = m[2].trim().replace(/\s+/g, " ");
    const title = (desc.split(":")[0] ?? desc).replace(/\*\*/g, "").trim();
    const reqs: string[] = [...m[3].matchAll(/\bREQ-(\d{3}[a-z0-9]*)\b/g)].map((r) => "REQ-" + r[1]);
    map.set(m[1], { title, reqs });
  }
  return map;
}

// A bundled test name ("T121/T116: redo restores prior state") claims every ID
// before the colon, but the assertion may only exercise one of them. Flag an ID
// whose Appendix F title shares no vocabulary with the test's own description:
// candidate orphan mapping (the ID rides along without being exercised).
function orphanIdsInTestName(name: string, appF: Map<string, AppFEntry>, occurrences: Map<string, number>): string[] {
  const colon = name.indexOf(":");
  if (colon === -1) return [];
  const prefix = name.slice(0, colon);
  const suffix = name.slice(colon + 1);
  const prefixIds = [...prefix.matchAll(/\b([TIS]\d+[a-z0-9]*)\b/g)].map((m) => m[1]);
  if (prefixIds.length < 2) return [];
  const suffixTokens = tokenize(suffix);
  const out: string[] = [];
  for (const id of prefixIds) {
    // Only a singleton occurrence can be an orphan: if the same ID names
    // another executed test, that test is the ID's real evidence.
    if ((occurrences.get(id) ?? 0) > 1) continue;
    const f = appF.get(id);
    if (!f || !f.title) continue;
    const titleTokens = tokenize(f.title);
    if (titleTokens.length === 0) continue;
    const shares = titleTokens.some((tt) =>
      suffixTokens.some((st) => st === tt || (tt.length >= 4 && st.startsWith(tt.slice(0, 4))) || (st.length >= 4 && tt.startsWith(st.slice(0, 4))))
    );
    if (!shares) out.push(id);
  }
  return out;
}

// §6.6 sub-workflow map: `| REQ-197 | I1, I4 | Room CRUD |` is parsed by
// scripts/lib/subworkflow.ts.

const STOP = new Set([
  "and", "the", "for", "with", "every", "each", "when", "that", "from",
  "into", "shall", "part", "etc", "within", "under", "over", "its", "not",
  "are", "has", "have", "all", "may", "must", "only", "also", "per", "via",
  "non", "one", "two", "out", "but", "any", "can", "who", "how", "use",
  "uses", "new", "own", "same", "which", "where", "this", "these", "those",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function cleanBody(raw: string): string {
  return raw
    .replace(/\*Check:\*[\s\S]*$/i, "")
    .replace(/_Check:_[\s\S]*$/i, "")
    .replace(/\*Acceptance criterion:\*[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface Dossier {
  reqId: string;
  title: string;
  section: string;
  bucket: string;
  subParts: string[];
  citeSites: CiteSite[];
  mappedTests: string[];
  exercisedTests: string[];
  hasCheck: boolean;
  signals: string[];
  contract: string;
  testBodies: TestBody[];
}

function buildDossiers(): Dossier[] {
  const text = readSpec();
  const bodies = extractReqBodies(text);
  const register = parseRegister();
  const cites = gatherCiteSites();
  const testBodies = gatherTestBodies();
  const appF = parseAppendixFReqTests(text);
  const appFEntries = parseAppendixF(text);
  const subMap = parseSubworkflowMap(text);
  const testNames = gatherTestNames();
  const occurrences = new Map<string, number>();
  for (const tn of testNames) {
    for (const id of new Set(tn.allIds)) occurrences.set(id, (occurrences.get(id) ?? 0) + 1);
  }

  // Group spec REQ IDs by base.
  const subPartsOf = new Map<string, string[]>();
  const allIds = [...bodies.keys()];
  for (const id of allIds) {
    const base = baseReq(id);
    if (!subPartsOf.has(base)) subPartsOf.set(base, []);
    if (id !== base) subPartsOf.get(base)!.push(id);
  }

  const dossiers: Dossier[] = [];
  for (const [base, reg] of register) {
    const ids = [base, ...(subPartsOf.get(base) ?? [])];
    const sites: CiteSite[] = [];
    for (const id of ids) sites.push(...(cites.get(id) ?? []));
    sites.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

    const mapped = new Set<string>();
    for (const id of ids) {
      for (const t of appF.get(id) ?? []) mapped.add(t);
      for (const t of subMap.get(id) ?? []) mapped.add(t);
    }

    const hasCheck = ids.some((id) => {
      const b = bodies.get(id)?.body ?? "";
      return b.includes("*Check:*") || b.includes("_Check:_");
    });

    // Contract: concatenate sub-part bodies in order, base first.
    const parts: string[] = [];
    for (const id of ids) {
      const b = bodies.get(id)?.body ?? "";
      const c = cleanBody(b);
      if (c) parts.push(ids.length > 1 ? `${id}: ${c}` : c);
    }
    const contract = parts.join(" | ");

    const signals: string[] = [];
    if (sites.length === 0) signals.push("no-cite");
    else if (sites.every((s) => s.isComment)) signals.push("weak-cite-only-comments");
    if (reg.exercisedTests.length === 0) signals.push("untested");
    if (!hasCheck) signals.push("no-check");
    if (ids.length > 1) signals.push(`${ids.length - 1}-subparts`);

    // Heuristic: an exercised test whose name shares almost no vocabulary with
    // the REQ title is likely an adjacent test that carries the ID but does not
    // exercise the contract (e.g. T116 "redo restores prior state" mapped to
    // REQ-113 "Result count reporting"). Candidate for semantic review, not a
    // verdict.
    const titleTokens = new Set(tokenize(reg.title.replace(/\(.*?\)/g, "")));
    const testNameText = reg.exercisedTests
      .map((t) => (testBodies.get(t) ?? []).map((b) => b.name).join(" "))
      .join(" ");
    const testTokens = new Set(tokenize(testNameText));
    let overlap = 0;
    for (const t of titleTokens) if (testTokens.has(t)) overlap++;
    const ratio = titleTokens.size > 0 ? overlap / titleTokens.size : 1;
    if (reg.bucket === "C" && titleTokens.size >= 3 && ratio < 0.34) {
      signals.push(`test-title-divergence ${overlap}/${titleTokens.size}`);
    }

    const orphans = new Set<string>();
    for (const t of reg.exercisedTests) {
      for (const b of testBodies.get(t) ?? []) {
        for (const o of orphanIdsInTestName(b.name, appFEntries, occurrences)) orphans.add(o);
      }
    }
    if (orphans.size > 0) signals.push(`orphan-test-id(${[...orphans].join(",")})`);

    const testBodiesForReq: TestBody[] = [];
    for (const t of reg.exercisedTests) if (testBodies.has(t)) testBodiesForReq.push(...testBodies.get(t)!);

    dossiers.push({
      reqId: base,
      title: reg.title,
      section: reg.section,
      bucket: reg.bucket,
      subParts: subPartsOf.get(base) ?? [],
      citeSites: sites,
      mappedTests: [...mapped].sort(),
      exercisedTests: reg.exercisedTests,
      hasCheck,
      signals,
      contract,
      testBodies: testBodiesForReq.slice(0, 4),
    });
  }
  return dossiers;
}

// Bundle-dependency report. For every executed `test("<name>")` that carries
// more than MAX_IDS_PER_TEST_NAME leading identifiers, list the REQs whose
// exercised evidence is exactly that bundle's prefix IDs — i.e. REQs that
// silently fall from bucket C to B if the bundle's misleading IDs are trimmed.
// This is the definitive residual worklist for the coverage-integrity audit
// (spec-code comparison SC-6). Read-only.
function renderBundleReport(): string {
  const text = readSpec();
  const bodies = extractReqBodies(text);
  const appF = parseAppendixFReqTests(text);
  const subMap = parseSubworkflowMap(text);
  const testNames = gatherTestNames();

  const subPartsOf = new Map<string, string[]>();
  for (const id of bodies.keys()) {
    const base = baseReq(id);
    if (!subPartsOf.has(base)) subPartsOf.set(base, []);
    if (id !== base) subPartsOf.get(base)!.push(id);
  }

  const idToNames = new Map<string, Set<number>>();
  testNames.forEach((tn, i) => {
    for (const id of new Set(tn.allIds)) {
      if (!idToNames.has(id)) idToNames.set(id, new Set());
      idToNames.get(id)!.add(i);
    }
  });

  // Exercised test set per base REQ (base + sub-parts), used to decide whether
  // dropping an ID from a bundle leaves every REQ it maps to still evidenced.
  const exercisedOf = new Map<string, Set<string>>();
  for (const [base, subs] of subPartsOf) {
    const set = new Set<string>();
    for (const id of [base, ...subs]) {
      for (const t of appF.get(id) ?? []) if (idToNames.has(t)) set.add(t);
      for (const t of subMap.get(id) ?? []) if (idToNames.has(t)) set.add(t);
    }
    exercisedOf.set(base, set);
  }
  const droppable = (id: string): boolean => {
    for (const [base, exercised] of exercisedOf) {
      if (!exercised.has(id)) continue;
      let others = 0;
      for (const t of exercised) if (t !== id) others++;
      if (others === 0) return false;
    }
    return true;
  };

  const lines: string[] = [];
  const dependentTotal = new Set<string>();
  for (let i = 0; i < testNames.length; i++) {
    const tn = testNames[i];
    if (tn.prefixIds.length <= MAX_IDS_PER_TEST_NAME) continue;
    const prefixSet = new Set(tn.prefixIds);
    const suffixSet = new Set(tn.allIds.filter((id) => !prefixSet.has(id)));
    const dependent: string[] = [];
    const shared: string[] = [];
    for (const [base, subs] of subPartsOf) {
      const ids = [base, ...subs];
      const specTests = new Set<string>();
      for (const id of ids) {
        for (const t of appF.get(id) ?? []) specTests.add(t);
        for (const t of subMap.get(id) ?? []) specTests.add(t);
      }
      const exercised = [...specTests].filter((t) => idToNames.has(t));
      // Only REQs this bundle actually contributes to: at least one exercised
      // ID sits in the bundle's prefix.
      if (!exercised.some((t) => prefixSet.has(t))) continue;
      const anchored = exercised.some((t) => !prefixSet.has(t) || (idToNames.get(t)?.size ?? 0) > 1);
      if (anchored) { shared.push(base); continue; }
      dependent.push(base);
      dependentTotal.add(base);
    }
    lines.push(`BUNDLE ${tn.file} "${tn.name.slice(0, 70)}…" (${tn.prefixIds.length} IDs)`);
    lines.push(`  ids: ${tn.prefixIds.map((id) => `${id}×${idToNames.get(id)?.size ?? 0}`).join(", ")}`);
    const canDrop = tn.prefixIds.filter(droppable);
    const mustKeep = tn.prefixIds.filter((id) => !droppable(id));
    lines.push(`  safe-to-drop: ${canDrop.join(", ") || "—"}`);
    const over = tn.prefixIds.length - MAX_IDS_PER_TEST_NAME;
    const trimmed = over <= canDrop.length ? tn.prefixIds.filter((id) => !canDrop.slice(0, over).includes(id)) : tn.prefixIds;
    lines.push(`  suggested-trim (${trimmed.length}): ${trimmed.join("/")}${over > canDrop.length ? `  [UNRESOLVABLE — ${mustKeep.length} IDs are sole evidence]` : ""}`);
    if (dependent.length) lines.push(`  bundle-only (fall C→B if prefix IDs trimmed): ${dependent.join(", ")}`);
    if (shared.length) lines.push(`  also-evidenced-elsewhere: ${shared.join(", ")}`);
    if (suffixSet.size > 0) lines.push(`  note: suffix carries ${[...suffixSet].join(",")}`);
    lines.push("");
  }
  lines.push(`Bundle-dependent REQs (${dependentTotal.size}): ${[...dependentTotal].sort().join(", ")}`);
  return lines.join("\n") + "\n";
}

// REQ-321d-class detector — a bucket-C REQ whose exercised evidence is
// entirely shared with other REQs (no test that exercises it exclusively)
// rests on bundled evidence the coverage audit cannot distinguish from real
// verification. Comment-only citations are reported separately as advisory.
function renderDedicatedReport(rows: Dossier[]): string {
  const ownersOf = new Map<string, string[]>();
  for (const r of rows) for (const t of r.exercisedTests) {
    const owners = ownersOf.get(t) ?? [];
    owners.push(r.reqId);
    ownersOf.set(t, owners);
  }
  const noDedicated = rows.filter((r) =>
    r.bucket === "C" && r.exercisedTests.length > 0 &&
    r.exercisedTests.every((t) => (ownersOf.get(t) ?? []).length > 1));
  const weakCite = rows.filter((r) => r.bucket === "C" && r.signals.includes("weak-cite-only-comments"));
  const lines: string[] = [];
  lines.push(`Dedicated-evidence report`);
  lines.push(`  Bucket-C REQs with no dedicated exercised test: ${noDedicated.length}`);
  for (const r of [...noDedicated].sort((a, b) => a.reqId.localeCompare(b.reqId))) {
    lines.push(`  - ${r.reqId} (${r.section}) exercised only via shared: ${r.exercisedTests.join(", ")}`);
  }
  lines.push(`  Bucket-C REQs cited only in comments (advisory): ${weakCite.length}`);
  return lines.join("\n") + "\n";
}

function sectionSort(a: string, b: string): number {
  const na = a.match(/^(\d+)\.(\d+)/);
  const nb = b.match(/^(\d+)\.(\d+)/);
  if (na && nb) return Number(na[1]) - Number(nb[1]) || Number(na[2]) - Number(nb[2]);
  return a.localeCompare(b);
}

function renderMarkdown(rows: Dossier[]): string {
  const sections = new Map<string, Dossier[]>();
  for (const r of rows) {
    if (!sections.has(r.section)) sections.set(r.section, []);
    sections.get(r.section)!.push(r);
  }
  const lines: string[] = [];
  for (const sec of [...sections.keys()].sort(sectionSort)) {
    lines.push(`\n## §${sec}\n`);
    for (const r of sections.get(sec)!.sort((a, b) => a.reqId.localeCompare(b.reqId))) {
      lines.push(`### ${r.reqId} — ${r.title}  [${r.bucket}]`);
      const siteStr = r.citeSites.length === 0
        ? "none"
        : r.citeSites.map((s) => `${s.file}:${s.line}${s.isComment ? " (comment)" : ""}`).join(", ");
      lines.push(`- cites: ${siteStr}`);
      lines.push(`- tests: mapped ${r.mappedTests.join(",") || "—"} | exercised ${r.exercisedTests.join(",") || "—"}`);
      lines.push(`- signals: ${r.signals.join(", ") || "none"}`);
      lines.push(`- contract: ${r.contract.slice(0, 700)}`);
      for (const tb of r.testBodies) {
        lines.push(`  - test[${tb.file}] "${tb.name}": ${tb.snippet.replace(/\n/g, " ⏎ ").slice(0, 320)}`);
      }
    }
  }
  return lines.join("\n") + "\n";
}

function renderCompact(rows: Dossier[]): string {
  const lines: string[] = [];
  for (const r of rows.sort((a, b) => a.reqId.localeCompare(b.reqId))) {
    const tests = [...new Set(r.testBodies.map((b) => b.name))].join(" ;; ") || "—";
    lines.push(`${r.reqId} [${r.bucket}] §${r.section.split(" ")[0]} — ${r.title}`);
    lines.push(`  signals: ${r.signals.join(", ")}`);
    lines.push(`  exercised: ${r.exercisedTests.join(",") || "—"} | mapped: ${r.mappedTests.join(",") || "—"}`);
    lines.push(`  tests: ${tests}`);
  }
  return lines.join("\n") + "\n";
}

function printSummary(rows: Dossier[]): void {
  const byBucket: Record<string, number> = {};
  const noCiteByBucket: Record<string, number> = {};
  const weakByBucket: Record<string, number> = {};
  const untestedByBucket: Record<string, number> = {};
  let noCite = 0, weakCite = 0, untested = 0, noCheck = 0;
  for (const r of rows) {
    byBucket[r.bucket] = (byBucket[r.bucket] ?? 0) + 1;
    if (r.signals.includes("no-cite")) { noCite++; noCiteByBucket[r.bucket] = (noCiteByBucket[r.bucket] ?? 0) + 1; }
    if (r.signals.includes("weak-cite-only-comments")) { weakCite++; weakByBucket[r.bucket] = (weakByBucket[r.bucket] ?? 0) + 1; }
    if (r.signals.includes("untested")) { untested++; untestedByBucket[r.bucket] = (untestedByBucket[r.bucket] ?? 0) + 1; }
    if (r.signals.includes("no-check")) noCheck++;
  }
  // Real parity check: distinct REQ IDs cited in holonovel/src (validate's
  // gatherSourceCites walks src only) and distinct test IDs exercised in
  // holonovel/scripts (validate's gatherExercisedIds).
  const srcCites = new Set<string>();
  for (const r of rows) for (const s of r.citeSites) if (s.file.startsWith("holonovel/src/")) srcCites.add(`${r.reqId}:${s.line}`);
  const exercised = new Set<string>();
  for (const r of rows) for (const t of r.exercisedTests) exercised.add(t);
  process.stdout.write(`REQs: ${rows.length}\n`);
  process.stdout.write(`Buckets: ${JSON.stringify(byBucket)}\n`);
  process.stdout.write(`Signals: no-cite ${noCite}, weak-cite-only-comments ${weakCite}, untested ${untested}, no-check ${noCheck}\n`);
  process.stdout.write(`Signals by bucket: no-cite ${JSON.stringify(noCiteByBucket)}, weak-cite ${JSON.stringify(weakByBucket)}, untested ${JSON.stringify(untestedByBucket)}\n`);
  process.stdout.write(`Parity: base REQs with a holonovel/src cite site ${new Set(rows.filter((r) => r.citeSites.some((s) => s.file.startsWith("holonovel/src/"))).map((r) => r.reqId)).size}; register-exercised test IDs ${exercised.size}\n`);
  const bySection = new Map<string, { total: number; untested: number; weak: number }>();
  for (const r of rows) {
    const s = bySection.get(r.section) ?? { total: 0, untested: 0, weak: 0 };
    s.total++;
    if (r.signals.includes("untested")) s.untested++;
    if (r.signals.includes("weak-cite-only-comments")) s.weak++;
    bySection.set(r.section, s);
  }
  for (const sec of [...bySection.keys()].sort(sectionSort)) {
    const s = bySection.get(sec)!;
    process.stdout.write(`  §${sec}: ${s.total} REQs, ${s.untested} untested, ${s.weak} weak-cite\n`);
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, `Usage: npx tsx scripts/compare-spec-code.ts [--section 5.1] [--out FILE] [--json FILE] [--check] [--bundles] [--dedicated] [--gate] [--help]\n`);
  const onlySection = parseValueFlag(argv, "--section");
  const onlySignal = parseValueFlag(argv, "--signals");
  const outPath = parseValueFlag(argv, "--out");
  const jsonPath = parseValueFlag(argv, "--json");
  const check = parseFlag(argv, "--check");
  const bundles = parseFlag(argv, "--bundles");
  const dedicated = parseFlag(argv, "--dedicated");
  const gate = parseFlag(argv, "--gate");

  // --dedicated: report bucket-C REQs with no dedicated exercised test (the
  // false-C class). With --gate, exit non-zero when any exist.
  if (dedicated) {
    const rows = buildDossiers();
    const report = renderDedicatedReport(rows);
    process.stdout.write(report);
    const m = report.match(/no dedicated exercised test: (\d+)/);
    const n = m ? parseInt(m[1], 10) : 0;
    if (gate) {
      process.stdout.write(n > 0 ? `FAIL: ${n} REQ(s) with no dedicated evidence\n` : "PASS: every bucket-C REQ has dedicated evidence\n");
      process.exit(n > 0 ? 1 : 0);
    }
    return;
  }

  if (bundles) {
    process.stdout.write(renderBundleReport());
    return;
  }

  // --gate: exit non-zero when any REQ is bundle-dependent (sole evidence is a
  // bundled, over-stuffed test name). Wired into `check:conformance`.
  if (gate) {
    const report = renderBundleReport();
    process.stdout.write(report);
    const m = report.match(/Bundle-dependent REQs \((\d+)\)/);
    const n = m ? parseInt(m[1], 10) : 0;
    process.stdout.write(n > 0 ? `FAIL: ${n} bundle-dependent REQ(s)\n` : "PASS: no bundle-dependent REQs\n");
    process.exit(n > 0 ? 1 : 0);
  }

  const all = buildDossiers();
  let rows = onlySection ? all.filter((r) => r.section.startsWith(onlySection)) : all;
  if (onlySignal) rows = rows.filter((r) => r.signals.some((s) => s.includes(onlySignal)));

  if (check) {
    printSummary(all);
    return;
  }
  if (jsonPath) {
    fs.writeFileSync(path.resolve(jsonPath), JSON.stringify(rows, null, 2));
    process.stdout.write(`Wrote ${rel(path.resolve(jsonPath))} (${rows.length} rows)\n`);
  }
  const md = onlySignal ? renderCompact(rows) : renderMarkdown(rows);
  if (outPath) {
    fs.writeFileSync(path.resolve(outPath), md);
    process.stdout.write(`Wrote ${rel(path.resolve(outPath))} (${rows.length} rows)\n`);
  } else {
    process.stdout.write(md);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`fatal: ${(err as Error).message}\n`);
  process.exit(2);
}
