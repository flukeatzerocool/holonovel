// Shared REQ integrity checks. Consumed by validate.ts (spec gate).

const REQ_TOKEN_RE = /\bREQ-(\d{3,}[a-z0-9]*)\b/g;
const VALID_ID_RE = /^REQ-\d{3}(?:[a-z]\d*)?$/;

export function checkReqIdGrammar(text: string): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(REQ_TOKEN_RE)) {
    const token = m[0];
    if (seen.has(token)) continue;
    seen.add(token);
    if (!VALID_ID_RE.test(token)) {
      issues.push(`malformed REQ ID: ${token} (expected REQ-NNN or REQ-NNNl / REQ-NNNlN)`);
    }
  }
  return issues;
}

const REQ_HEADER_RE = /\*\*(REQ-\d{3}[a-z0-9]*)\s+—\s+.+?\.\*\*/g;
export function checkEmptyReqBodies(text: string): string[] {
  const issues: string[] = [];
  const terminatorRe = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+|^---\s*$/gm;
  for (const h of text.matchAll(REQ_HEADER_RE)) {
    const bodyStart = (h.index ?? 0) + h[0].length;
    terminatorRe.lastIndex = bodyStart;
    const t = terminatorRe.exec(text);
    const body = t ? text.slice(bodyStart, t.index) : text.slice(bodyStart);
    if (body.trim().length === 0) {
      issues.push(`${h[1]}: empty body — no content between header and next REQ/heading`);
    }
  }
  return issues;
}

export function checkTruncatedReqBodies(text: string): string[] {
  const issues: string[] = [];
  const terminatorRe = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+|^---\s*$/gm;
  for (const h of text.matchAll(REQ_HEADER_RE)) {
    const bodyStart = (h.index ?? 0) + h[0].length;
    terminatorRe.lastIndex = bodyStart;
    const t = terminatorRe.exec(text);
    const body = t ? text.slice(bodyStart, t.index) : text.slice(bodyStart);
    if (/^[a-z]/.test(body.trim())) {
      issues.push(`${h[1]}: body begins with a lowercase letter — truncated lead clause`);
    }
  }
  return issues;
}

export function checkDecisionsCitations(text: string): string[] {
  const issues: string[] = [];
  const terminatorRe = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+|^---\s*$/gm;
  for (const h of text.matchAll(REQ_HEADER_RE)) {
    const bodyStart = (h.index ?? 0) + h[0].length;
    terminatorRe.lastIndex = bodyStart;
    const t = terminatorRe.exec(text);
    const body = t ? text.slice(bodyStart, t.index) : text.slice(bodyStart);
    const citeRe = /DECISIONS\.md \((\d+)\)/g;
    let c: RegExpExecArray | null;
    while ((c = citeRe.exec(body)) !== null) {
      const n = parseInt(c[1], 10);
      if (n < 1 || n > 6) {
        issues.push(`${h[1]}: DECISIONS.md section (${n}) is undefined — §9 enumerates sections (1)–(6)`);
      }
    }
  }
  return issues;
}

// A statement of how many property groups the Novel has can drift as the §7.7
// table grows. Parse the table as the single source of truth and flag any
// numeric statement that disagrees with it.
const NUMBER_WORDS =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|" +
  "fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|" +
  "fifty|sixty|seventy|eighty|ninety|hundred";
const PROPERTY_COUNT_RE = new RegExp(
  `(?<![\\w.])(${NUMBER_WORDS}|\\d+)(?:[\\s-](?:${NUMBER_WORDS}))?\\s+(?:total\\s+)?property groups\\b`,
  "gi",
);

const ONES: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const TEENS: Record<string, number> = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

function parseCount(token: string): number | null {
  if (/^\d+$/.test(token)) return parseInt(token, 10);
  const parts = token.toLowerCase().split(/[-\s]+/);
  if (parts.length === 1) return ONES[parts[0]] ?? TEENS[parts[0]] ?? TENS[parts[0]] ?? (parts[0] === "hundred" ? 100 : null);
  if (parts.length === 2 && TENS[parts[0]] !== undefined && ONES[parts[1]] !== undefined) return TENS[parts[0]] + ONES[parts[1]];
  return null;
}

// Count the rows of the §7.7 property table (header carries `Property` and `Archetypes`).
export function actualPropertyGroupCount(text: string): number {
  const lines = text.split("\n");
  const headerIdx = lines.findIndex((l) => l.includes("| Property |") && l.includes("Archetypes"));
  if (headerIdx === -1) return 0;
  let count = 0;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) break;
    if (/^\|\s*-+/.test(line)) continue;
    const name = line.split("|").map((s) => s.trim()).filter(Boolean)[0];
    if (name) count++;
  }
  return count;
}

export function checkPropertyGroupCount(text: string): string[] {
  const issues: string[] = [];
  const actual = actualPropertyGroupCount(text);
  if (actual === 0) return issues;
  for (const line of text.split("\n")) {
    for (const m of line.matchAll(PROPERTY_COUNT_RE)) {
      const n = parseCount(m[1]);
      if (n !== null && n !== actual) {
        issues.push(`stated "${m[0]}" but the §7.7 table defines ${actual} property groups`);
      }
    }
  }
  return issues;
}

// The build-phase-map file-index row declares an §5 subsection count. Compare it
// to the actual `### 5.N` headings so the declaration cannot drift.
export function checkBuildPhaseMapCounts(mapText: string, specText: string): string[] {
  const issues: string[] = [];
  const row = mapText.split("\n").find((l) => l.includes("02-requirements.md"));
  if (!row) return issues;
  const m = row.match(/(\d+)\s+subsections/);
  if (!m) return issues;
  const declared = parseInt(m[1], 10);
  const actual = (specText.match(/^### 5\.\d+\b/gm) ?? []).length;
  if (declared !== actual) {
    issues.push(`build-phase-map declares ${declared} §5 subsections but the spec has ${actual}`);
  }
  return issues;
}

// ─── REQ-body content scans (Appendix M enforcement aids) ───────────────
// Heuristic, report-only. They surface method and worked-example leakage into
// REQ bodies that Appendix M routes to §6/§7 and the fixture appendices. Kept
// as warnings until the false-positive rate is measured and baselined.

const BODY_TERMINATOR_RE = /\*\*REQ-\d{3}[a-z0-9]*\s+—|^#{1,4}\s+|^---\s*$/gm;

function extractBodies(text: string): { id: string; body: string }[] {
  const out: { id: string; body: string }[] = [];
  for (const h of text.matchAll(REQ_HEADER_RE)) {
    const bodyStart = (h.index ?? 0) + h[0].length;
    BODY_TERMINATOR_RE.lastIndex = bodyStart;
    const t = BODY_TERMINATOR_RE.exec(text);
    const body = t ? text.slice(bodyStart, t.index) : text.slice(bodyStart);
    out.push({ id: h[1], body });
  }
  return out;
}

function baseOf(id: string): string {
  return id.replace(/^REQ-(\d{3}).*$/, "REQ-$1");
}

// Every REQ family — a base REQ or its lettered parts — must carry at least one
// _Check: trailer (Appendix M; see checkImplCoverage for the family model).
export function checkFamilyCheckCoverage(text: string): string[] {
  const issues: string[] = [];
  const fam = new Map<string, boolean>();
  for (const { id, body } of extractBodies(text)) {
    const base = baseOf(id);
    fam.set(base, (fam.get(base) ?? false) || /[*_]Check:[*_]/.test(body));
  }
  for (const [base, has] of [...fam].sort()) {
    if (!has) issues.push(`${base} family has no _Check: trailer`);
  }
  return issues;
}

const PROCEDURAL_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bCriterion \([a-z]\)/g, label: "enumerated criterion" },
  { re: /\bin order, stopping\b/gi, label: "ordered algorithm" },
  { re: /\bsorted? by\b/gi, label: "sort order" },
  { re: /\biterate[sd]?\b/gi, label: "iteration" },
  { re: /\bpack tiers in priority order\b/gi, label: "ordered algorithm" },
  { re: /\bdrop tiers in reverse priority order\b/gi, label: "ordered algorithm" },
  { re: /(?:missing|absent|no shared).*?→.*?otherwise/gi, label: "verdict ladder" },
];

export function checkReqProceduralContent(text: string): string[] {
  const issues: string[] = [];
  for (const { id, body } of extractBodies(text)) {
    for (const { re, label } of PROCEDURAL_PATTERNS) {
      const m = body.match(re);
      if (m) issues.push(`${id}: ${label} ("${m[0]}") in REQ body — move to §6/§7`);
    }
  }
  return issues;
}

// A parenthetical numeric default in a REQ body leaks a tuning value the
// runtime configuration surface (§7.6) or Appendix O owns (Appendix M).
export function checkReqDefaultClauses(text: string): string[] {
  const issues: string[] = [];
  for (const { id, body } of extractBodies(text)) {
    if (/\(default\s+\d/i.test(body)) {
      issues.push(`${id}: contains a parenthetical default value — §7.6/Appendix O owns defaults`);
    }
  }
  return issues;
}

const WORKED_EXAMPLE_PATTERNS: RegExp[] = [
  /[×=]\s*\(/,
  /\b\d+\s*\/\s*\d+\s*\(/,
  /\b\d+\s+(?:HIGH|MEDIUM|LOW)\b/,
  /\b\d+\s*[×x]\s*\d+\s*=/,
];

export function checkReqWorkedExamples(text: string): string[] {
  const issues: string[] = [];
  for (const { id, body } of extractBodies(text)) {
    for (const re of WORKED_EXAMPLE_PATTERNS) {
      const m = body.match(re);
      if (m) issues.push(`${id}: worked computation ("${m[0].trim()}") in REQ body — move to Appendix F / §B.3`);
    }
  }
  return issues;
}

const THRESHOLD_REF_RE = /§6\.5|§6\.2|§7\.6|Appendix O|Appendix S|Appendix G|Appendix H|TTRPG_/;
const THRESHOLD_PATTERNS: RegExp[] = [
  /\b\d+\s*%/,
  /\b\d+\s*\/\s*\d+\s+(?:items|sections|categories)/,
  /\(default \d+[^)]*\)/,
];

export function checkReqThresholds(text: string): string[] {
  const issues: string[] = [];
  for (const { id, body } of extractBodies(text)) {
    if (THRESHOLD_REF_RE.test(body)) continue;
    for (const re of THRESHOLD_PATTERNS) {
      const m = body.match(re);
      if (m) issues.push(`${id}: unbounded threshold/default ("${m[0].trim()}") in REQ body — cite §6.5/§7.6/Appendix O`);
    }
  }
  return issues;
}

// Base-capability tuning values live in Appendix O.11 (Appendix M ↔ Appendix S
// reconciliation). No §5.21–§5.23 REQ body may restate a default or a tuning
// value the appendix owns.

// Number words (value >= 4 only) that restate an Appendix O.11 tuning value.
// Small words like "one"/"two"/"three" occur in ordinary counts and examples
// ("two challenge dice"), so they are excluded to keep the false-positive rate
// at zero; the digit form still catches literal restatements.
const O11_NUMBER_WORDS: Record<string, number> = {
  four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
};

export function checkBaseCapabilityDefaults(text: string): string[] {
  const issues: string[] = [];
  const start = text.indexOf("### 5.21");
  const end = text.indexOf("### 5.24");
  if (start === -1 || end === -1 || end < start) {
    return ["ERROR: cannot locate §5.21–§5.24 headings for the base-capability default scan"];
  }
  const region = text.slice(start, end);

  // Values owned by the Appendix O.11 tuning table. A §5.21–§5.23 REQ body that
  // restates one without citing Appendix O leaks a tuning value the appendix
  // owns (Appendix M ↔ Appendix S). The table is parsed so the check tracks it.
  const oStart = text.indexOf("**O.11 —");
  const oEnd = oStart === -1 ? -1 : text.indexOf("\n---", oStart);
  const o11 = oStart === -1 ? "" : text.slice(oStart, oEnd === -1 ? undefined : oEnd);
  const owned = new Set<string>();
  for (const line of o11.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 5) continue;
    for (const m of cells[3].matchAll(/\d+/g)) owned.add(m[0]);
  }

  for (const { id, body } of extractBodies(region)) {
    const m = body.match(/\bdefaults? to\b|\(default\b/gi);
    if (m) {
      issues.push(`${id}: default value in base-capability REQ body ("${m[0]}") — move to Appendix O.11`);
      continue;
    }
    if (/Appendix O/.test(body)) continue;
    const tokens = new Set<string>();
    for (const d of body.matchAll(/\b\d+\b/g)) tokens.add(d[0]);
    for (const w of body.matchAll(/\b[a-z]+\b/gi)) {
      const n = O11_NUMBER_WORDS[w[0].toLowerCase()];
      if (n !== undefined) tokens.add(String(n));
    }
    const hit = [...tokens].find((t) => owned.has(t));
    if (hit) {
      issues.push(`${id}: restates an Appendix O.11 tuning value ("${hit}") without citing Appendix O`);
    }
  }
  return issues;
}

// A REQ that newly buckets to B (cited but no exercised test) is a coverage
// regression. REQs already recorded as B in the committed register are
// tolerated until their evidence lands, so the check can be added without a
// flag day.
export function checkNewBucketB(
  rows: Array<{ reqId: string; title: string; bucket: string }>,
  committedB: Set<string>,
): string[] {
  const issues: string[] = [];
  for (const row of rows) {
    if (row.bucket !== "B" || committedB.has(row.reqId)) continue;
    issues.push(`new bucket-B REQ ${row.reqId} ${row.title} — cited but has no exercised test`);
  }
  return issues;
}

// --- Verification-workflow coverage (REQ-158b, §5.10/§8) -------------------
// §10's blind verifier prompt must execute every workflow §8 defines. The
// prompt and its comparison table are the two surfaces checked; T193 is a
// separate appendix row. G1 is reserved and is stripped from the canonical set.
export function extractSection(text: string, headingPattern: RegExp): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => headingPattern.test(l));
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
}

function gateTableSet(section: string): Set<string> {
  const gates = new Set<string>();
  for (const line of section.split("\n")) {
    const m = line.match(/^\|\s*(G\d+[a-z]?)\s*\|/);
    if (m) gates.add(m[1].toLowerCase());
  }
  return gates;
}

function gateExpressionSet(expression: string, universe: Set<string>): Set<string> {
  const out = new Set<string>();
  const cleaned = expression.replace(/\([^)]*\)/g, " ");
  const range = /G(\d+)([a-z]?)\s*(?:through|to|–|—|-)\s*G(\d+)([a-z]?)/gi;
  let rest = cleaned;
  for (const m of cleaned.matchAll(range)) {
    const sm = Number(m[1]);
    const ss = (m[2] || "").toLowerCase();
    const em = Number(m[3]);
    const es = (m[4] || "").toLowerCase();
    for (const id of universe) {
      const g = id.match(/^g(\d+)([a-z]?)$/);
      if (!g) continue;
      const major = Number(g[1]);
      const suffix = g[2] || "";
      if (major < sm || major > em) continue;
      if (sm === em) {
        if (suffix >= ss && suffix <= es) out.add(id);
      } else if (major === sm) {
        if (suffix >= ss) out.add(id);
      } else if (major === em) {
        if (suffix <= es) out.add(id);
      } else {
        out.add(id);
      }
    }
    rest = rest.replace(m[0], " ");
  }
  for (const m of rest.matchAll(/G\d+[a-z]?/gi)) out.add(m[0].toLowerCase());
  return out;
}

function formatGates(set: Set<string>): string {
  return [...set].sort().join(", ") || "(none)";
}

export function checkIndependentVerificationCoverage(text: string): string[] {
  const issues: string[] = [];
  const workflows = extractSection(text, /^##\s*8[.\s]/);
  if (!workflows) return ["§10 coverage: cannot locate §8 Verification Workflows"];
  const canonical = gateTableSet(workflows);
  canonical.delete("g1");
  if (canonical.size === 0) return ["§10 coverage: §8 defines no workflow rows"];

  const independent = extractSection(text, /^##\s*10[.\s]/);
  if (!independent) return ["§10 coverage: cannot locate §10 Independent Verification"];

  const phase1 = independent.match(/Execute verification workflows\s+([^;\n]+);/i);
  if (!phase1) {
    issues.push("§10 coverage: Phase 1 does not state the workflows to execute");
  } else {
    const executed = gateExpressionSet(phase1[1], canonical);
    const missing = [...canonical].filter((g) => !executed.has(g));
    const extra = [...executed].filter((g) => !canonical.has(g));
    if (missing.length || extra.length) {
      issues.push(
        `§10 Phase 1 executes ${formatGates(executed)}; §8 defines ${formatGates(canonical)}` +
          (missing.length ? `; missing ${missing.join(", ")}` : "") +
          (extra.length ? `; not defined: ${extra.join(", ")}` : ""),
      );
    }
  }

  const compared = gateTableSet(independent);
  const missingCmp = [...canonical].filter((g) => !compared.has(g));
  const extraCmp = [...compared].filter((g) => !canonical.has(g));
  if (missingCmp.length || extraCmp.length) {
    issues.push(
      `§10 comparison table covers ${formatGates(compared)}; §8 defines ${formatGates(canonical)}` +
        (missingCmp.length ? `; missing ${missingCmp.join(", ")}` : "") +
        (extraCmp.length ? `; not defined: ${extraCmp.join(", ")}` : ""),
    );
  }
  return issues;
}

// --- License/source parity (Appendix U, §11.4, vendor tree, README) --------
export interface LicenseRow {
  source: string;
  kind: string;
  license: string;
  copyright: string;
}
export interface VendorDir {
  name: string;
  hasLicense: boolean;
}
export interface ManifestRow {
  source: string;
  module: string;
  file: string;
}

const SOURCE_ALIASES: Record<string, string> = {
  bitdsrd: "bitd",
  bladesinthedarksrd: "bitd",
  slyflourishlazygmresourcedocument: "lazygm",
  slyflourishlazygm: "lazygm",
  ironswornstarforgedsrd: "ironswornsrd",
  dungeonworldsrd: "dungeonworld",
  thealexandrian: "alexandrian",
  grahamnelsonsinform: "inform",
};

export function normalizeSource(source: string): string {
  const base = source
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]/g, "");
  return SOURCE_ALIASES[base] ?? base;
}

function normalizedDirectory(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function checkLicenseSourceParity(input: {
  uRows: LicenseRow[];
  s114Rows: Array<{ source: string }>;
  manifestRows: ManifestRow[];
  vendorDirs: VendorDir[];
  readmeSources: string[];
}): string[] {
  const issues: string[] = [];
  const narrative = input.uRows.filter((r) => r.kind.toLowerCase() === "narrative frameworks");
  const uKeys = new Map<string, LicenseRow[]>();
  for (const row of narrative) {
    const key = normalizeSource(row.source);
    if (!uKeys.has(key)) uKeys.set(key, []);
    uKeys.get(key)!.push(row);
  }
  const dirs = new Map(input.vendorDirs.map((d) => [normalizedDirectory(d.name), d]));

  for (const [key, rows] of uKeys) {
    const dir = dirs.get(key);
    if (!dir) {
      issues.push(`Appendix U narrative row "${rows[0].source}" has no vendored directory`);
      continue;
    }
    if (!dir.hasLicense) {
      issues.push(`vendored directory "${dir.name}" has no LICENSE file`);
    }
    const hasManifest = input.manifestRows.some((m) => normalizeSource(m.source) === key);
    if (!hasManifest) {
      issues.push(`vendored directory "${dir.name}" has no MANIFEST row`);
    }
  }
  for (const dir of input.vendorDirs) {
    const key = normalizedDirectory(dir.name);
    const rows = uKeys.get(key) ?? [];
    if (rows.length === 0) {
      issues.push(`vendored directory "${dir.name}" is not named by a Narrative frameworks row in Appendix U`);
    } else if (rows.length > 1) {
      issues.push(`vendored directory "${dir.name}" is named by ${rows.length} Narrative frameworks rows`);
    }
  }

  const s114 = new Set(input.s114Rows.map((r) => normalizeSource(r.source)));
  const uSet = new Set(uKeys.keys());
  const onlyU = [...uSet].filter((k) => !s114.has(k));
  const onlyS = [...s114].filter((k) => !uSet.has(k));
  if (onlyU.length || onlyS.length) {
    issues.push(
      `§11.4 table and Appendix U disagree` +
        (onlyU.length ? `; only in U: ${onlyU.join(", ")}` : "") +
        (onlyS.length ? `; only in §11.4: ${onlyS.join(", ")}` : ""),
    );
  }
  if (s114.size !== 8) {
    issues.push(`§11.4 table names ${s114.size} bundles; expected 8`);
  }

  const readme = new Set(input.readmeSources.map(normalizeSource));
  const allU = new Set(input.uRows.map((r) => normalizeSource(r.source)));
  const missingReadme = [...allU].filter((k) => !readme.has(k));
  const extraReadme = [...readme].filter((k) => !allU.has(k));
  if (missingReadme.length || extraReadme.length) {
    issues.push(
      `README footer and Appendix U disagree` +
        (missingReadme.length ? `; missing from footer: ${missingReadme.join(", ")}` : "") +
        (extraReadme.length ? `; only in footer: ${extraReadme.join(", ")}` : ""),
    );
  }
  return issues;
}

// REQ-309's 2026-09-10 rename (`command` → `run_command`, holonovel/DECISIONS.md)
// left bare `command` tokens in normative bodies. The action-binding gate
// (tool-citation-check) only sees `tool (action: …)` citations, so this covers
// the bare-token class. `allow` names bodies whose re-point is deferred because
// they sit in a fingerprinted section and are tracked in the review register.
const TOOL_TOKEN_RE = /`command`|command\(/;
// The MCP client-config schema key is a different namespace (REQ-163a names
// `command`, `args`, `cwd`, and `mcpServers` as config keys, not tools).
const CONFIG_SCHEMA_HINT_RE = /mcpServers|`args`|`cwd`/;

export function checkToolTokenDrift(
  bodies: ReadonlyArray<{ id: string; body: string }>,
  allow: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  for (const { id, body } of bodies) {
    if (allow.has(id)) continue;
    if (CONFIG_SCHEMA_HINT_RE.test(body)) continue;
    if (!TOOL_TOKEN_RE.test(body)) continue;
    issues.push(`${id}: cites the unregistered tool token \`command\` (registered: run_command)`);
  }
  return issues;
}

// REQ-370a — every archetype token a §7.7.0 pattern rule names must resolve.
// Pattern-rule source/target columns carry archetype tokens only (never
// property-group names), so the vocabulary and its alias map are the whole
// resolution set; an unresolvable token makes its rule unmatchable, which is a
// spec defect rather than a style nit.
export interface PatternRuleTokens {
  rule: string;
  srcTokens: string[];
  tgtTokens: string[];
}

export function unresolvedPatternRuleTokens(
  rules: ReadonlyArray<PatternRuleTokens>,
  valid: ReadonlySet<string>,
  aliases: Readonly<Record<string, readonly string[]>>,
): Array<{ rule: string; token: string }> {
  const issues: Array<{ rule: string; token: string }> = [];
  for (const rule of rules) {
    for (const token of [...rule.srcTokens, ...rule.tgtTokens]) {
      if (valid.has(token)) continue;
      if (Object.hasOwn(aliases, token)) continue;
      issues.push({ rule: rule.rule, token });
    }
  }
  return issues;
}

// Appendix M's ≤8-sentence rule. The sentence list comes from the shared
// splitter via `extractReqBodiesWithSentences`, which truncates the body at
// `*Acceptance criterion:*` — a trailing `_Check:_` stays inside the counted
// slice. The structural type keeps this module import-free.
export function checkReqSentenceCount(
  reqs: Map<string, { id: string; sentences: string[] }>,
): string[] {
  const issues: string[] = [];
  for (const [reqId, entry] of reqs) {
    const count = entry.sentences.length;
    if (count > 8) {
      issues.push(`${reqId}: ${count} sentences — exceeds the 8-sentence limit`);
    }
  }
  return issues;
}

// Harness title IDs must resolve to the Appendix F catalogue. An ID is either a
// catalogue row or a suffixed refinement of one (`T138a` refines `T138`); a
// zero-padded form is never an identifier (`T020` is not `T20`). A token that
// resolves nowhere evidences whichever REQ its parent happens to carry.
// The same zero-padding rule applies to IDs named in harness *comments*: a
// section banner like `// ── T056/T723` is how the padded form re-entered the
// corpus after the title pass was added. Only the padding branch runs here —
// a comment may legitimately name an ID in prose, so the catalogue-resolution
// branch of `checkHarnessTitleIds` stays title-only.
export function checkHarnessCommentIds(
  files: readonly { file: string; text: string }[],
): string[] {
  const issues: string[] = [];
  for (const { file, text } of files) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(/\bT0\d{2,}[a-z0-9]*\b/g)) {
        issues.push(`zero-padded test ID '${m[0]}' in ${file}:${i + 1}`);
      }
    }
  }
  return issues;
}

export function checkHarnessTitleIds(
  catalogue: ReadonlySet<string>,
  titles: readonly { file: string; name: string; all: readonly string[] }[],
): string[] {
  const issues: string[] = [];
  for (const title of titles) {
    for (const id of title.all) {
      if (!/^T\d+[a-z0-9]*$/.test(id)) continue; // S/I tokens are out of scope
      if (/^T0\d\d/.test(id)) {
        issues.push(`zero-padded test ID '${id}' in ${title.file}: "${title.name.slice(0, 60)}…"`);
        continue;
      }
      if (catalogue.has(id)) continue;
      const parent = id.match(/^T\d+/)![0];
      if (catalogue.has(parent)) continue;
      issues.push(`test ID '${id}' has no Appendix F row (parent '${parent}') in ${title.file}: "${title.name.slice(0, 60)}…"`);
    }
  }
  return issues;
}

// ─── REQ evidence linkage (REQ-158b family, report-only) ────────────────
// A REQ's `_Check:_` citation is evidence only if its Appendix F row kind
// admits it: an Automated row must be named by a harness test, a Manual row by
// a procedure documented in DECISIONS.md. The marker literals live here so the
// empty-body pass and validate's `hasCheck` cannot drift from the extractor.
export const CHECK_MARKERS = ["*Check:*", "_Check:_"] as const;

export interface LinkageFinding {
  reqId: string;
  tid: string;
  kind: string;
  verdict: "automated-unexercised" | "manual-undocumented" | "no-row" | "unknown-kind";
}

// Citations are read from the REQ body text, not from Appendix F's REQ column:
// the coverage audit joins on the latter, so a citation attributed elsewhere is
// invisible to it. The last marker wins; only T-IDs count (S/I sub-workflow
// tokens are out of scope); duplicates within one REQ collapse.
export function extractCheckCitations(
  bodies: ReadonlyMap<string, { body: string }>,
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [reqId, { body }] of bodies) {
    let at = -1;
    for (const marker of CHECK_MARKERS) at = Math.max(at, body.lastIndexOf(marker));
    if (at === -1) continue;
    const ids: string[] = [];
    for (const m of body.slice(at).matchAll(/\bT\d+[a-z0-9]*\b/g)) {
      if (!ids.includes(m[0])) ids.push(m[0]);
    }
    if (ids.length > 0) out.set(reqId, ids);
  }
  return out;
}

// ─── Evidence-label extraction (linkage + coverage) ─────────────────────
// A T-ID is evidence only in an emitting position: a `test(...)` name, either
// argument of `check(...)`, or a literal that is a `.push(`/`console.*` argument
// or `return`ed from a `function check*(…): string[]`. Comments and literals
// elsewhere — data arrays, unused consts, regex sources — are not evidence.
const STRING_LIT_RE = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g;
const EVIDENCE_ID_RE = /\b([TIS]\d+[a-z0-9]*)\b/g;

// One lexer pass yields two aligned views: `code` keeps string bodies with
// comments blanked, `masked` blanks both so a fixture containing code text is
// not read as a call site. Template interpolations (`` `a${x}` ``) are lexed as
// code, so nested literals cannot invert the state.
// A `/` opens a regex after an operator or keyword, not after a value.
function isRegexStart(emitted: string[]): boolean {
  for (let i = emitted.length - 1; i >= 0; i--) {
    const c = emitted[i]!;
    if (c === " " || c === "\n" || c === "\t") continue;
    if ("(,=:[!&|?{};+-*%<>~^".includes(c)) return true;
    if (/[A-Za-z]/.test(c)) {
      const word = emitted.join("").slice(-12).trimEnd();
      return /(?:^|[^A-Za-z])(return|typeof|case|in|of|new|delete|void)$/.test(word);
    }
    return false;
  }
  return false;
}

function lexMask(text: string): { code: string; masked: string } {
  const code: string[] = [];
  const masked: string[] = [];
  const stack: Array<"code" | "sq" | "dq" | "tpl"> = ["code"];
  const interpDepth: number[] = [];
  const put = (c: string, m: string): void => { code.push(c); masked.push(m); };
  let i = 0;
  while (i < text.length) {
    const mode = stack[stack.length - 1]!;
    const ch = text[i]!;
    const next = text[i + 1];
    if (mode === "sq" || mode === "dq") {
      if (ch === "\\") { put(ch + (next ?? ""), "  "); i += 2; continue; }
      if ((mode === "sq" && ch === "'") || (mode === "dq" && ch === '"')) { put(ch, ch); stack.pop(); i++; continue; }
      put(ch, " "); i++; continue;
    }
    if (mode === "tpl") {
      if (ch === "\\") { put(ch + (next ?? ""), "  "); i += 2; continue; }
      if (ch === "`") { put(ch, ch); stack.pop(); i++; continue; }
      if (ch === "$" && next === "{") { put("${", "  "); stack.push("code"); interpDepth.push(0); i += 2; continue; }
      put(ch, " "); i++; continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") { put(" ", " "); i++; }
      continue;
    }
    if (ch === "/" && next === "*") {
      put("  ", "  "); i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) { put(text[i] === "\n" ? "\n" : " ", " "); i++; }
      put("  ", "  "); i += 2; continue;
    }
    // A regex literal can contain quote characters; without this skip the
    // quote state desyncs and the rest of the file reads as one string.
    if (ch === "/" && isRegexStart(code)) {
      put(ch, ch); i++;
      let inClass = false;
      while (i < text.length) {
        const rc = text[i]!;
        if (rc === "\\") { put(rc + (text[i + 1] ?? ""), "  "); i += 2; continue; }
        if (rc === "[") inClass = true;
        else if (rc === "]") inClass = false;
        else if (rc === "/" && !inClass) { put(rc, rc); i++; break; }
        put(rc, " "); i++;
      }
      while (i < text.length && /[a-z]/i.test(text[i]!)) { put(text[i]!, " "); i++; }
      continue;
    }
    if (ch === "'") { put(ch, ch); stack.push("sq"); i++; continue; }
    if (ch === '"') { put(ch, ch); stack.push("dq"); i++; continue; }
    if (ch === "`") { put(ch, ch); stack.push("tpl"); i++; continue; }
    if (interpDepth.length > 0) {
      const top = interpDepth.length - 1;
      if (ch === "{") interpDepth[top] = interpDepth[top]! + 1;
      else if (ch === "}") {
        if (interpDepth[top] === 0) { put(ch, " "); interpDepth.pop(); stack.pop(); i++; continue; }
        interpDepth[top] = interpDepth[top]! - 1;
      }
    }
    put(ch, ch); i++;
  }
  return { code: code.join(""), masked: masked.join("") };
}

// Index of the `)` balancing the `(` at `open`, skipping string bodies.
function closingParen(code: string, open: number): number {
  let depth = 0;
  let quote = "";
  for (let i = open; i < code.length; i++) {
    const ch = code[i]!;
    if (quote) {
      if (ch === "\\") { i++; continue; }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") depth++;
    else if (ch === ")") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function literalsIn(segment: string): string[] {
  const ids: string[] = [];
  for (const m of segment.matchAll(STRING_LIT_RE)) {
    for (const id of m[0].matchAll(EVIDENCE_ID_RE)) ids.push(id[1]!);
  }
  return ids;
}

// [start, end) ranges of a call's argument list, found on the masked text.
function callRanges(masked: string, callRe: RegExp): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of masked.matchAll(callRe)) {
    const open = masked.indexOf("(", m.index! + m[0].length - 1);
    if (open === -1) continue;
    const close = closingParen(masked, open);
    if (close === -1) continue;
    out.push([open + 1, close]);
  }
  return out;
}

// [start, end) ranges of `function check*(…): string[]` bodies.
function checkFunctionRanges(masked: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of masked.matchAll(/function\s+check\w*\s*\([^)]*\)\s*:\s*string\[\]\s*\{/g)) {
    let depth = 0;
    for (let i = m.index! + m[0].length - 1; i < masked.length; i++) {
      const ch = masked[i]!;
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { out.push([m.index! + m[0].length, i]); break; } }
    }
  }
  return out;
}

// Cut a range at its first top-level comma (the first argument only).
function firstArgumentEnd(masked: string, start: number, end: number): number {
  let depth = 0;
  for (let i = start; i < end; i++) {
    const ch = masked[i]!;
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) return i;
  }
  return end;
}

// `return` statement ranges inside a check body, cut at the terminating
// semicolon, so a multi-statement body does not leak into the next statement.
function returnRanges(masked: string, start: number, end: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of masked.slice(start, end).matchAll(/\breturn\b/g)) {
    const from = start + m.index!;
    let depth = 0;
    for (let i = from; i < end; i++) {
      const ch = masked[i]!;
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") depth--;
      else if (ch === ";" && depth === 0) { out.push([from, i]); break; }
    }
  }
  return out;
}

export function labelsFromContent(text: string): string[] {
  const { code, masked } = lexMask(text);
  const take = (start: number, end: number): string[] => literalsIn(code.slice(start, end));
  const ids: string[] = [];
  for (const [start, end] of callRanges(masked, /\btest\s*\(/g)) {
    ids.push(...take(start, firstArgumentEnd(masked, start, end)));
  }
  for (const [start, end] of callRanges(masked, /\bcheck\s*\(/g)) ids.push(...take(start, end));
  const pushes = callRanges(masked, /\.push\s*\(/g);
  const reports = callRanges(masked, /\bconsole\s*\.\s*\w+\s*\(/g);
  for (const [start, end] of checkFunctionRanges(masked)) {
    for (const [s, e] of pushes) if (s > start && e < end) ids.push(...take(s, e));
    for (const [s, e] of reports) if (s > start && e < end) ids.push(...take(s, e));
    for (const [s, e] of returnRanges(masked, start, end)) ids.push(...take(s, e));
  }
  return [...new Set(ids)].sort();
}

export function checkReqEvidenceLinkage(input: {  citations: ReadonlyMap<string, string[]>;
  rows: ReadonlyMap<string, { kind: string }>;
  exercised: ReadonlySet<string>;
  decisionsText: string | null;
}): LinkageFinding[] {
  const findings: LinkageFinding[] = [];
  for (const [reqId, tids] of input.citations) {
    for (const tid of tids) {
      const row = input.rows.get(tid);
      if (!row) {
        findings.push({ reqId, tid, kind: "none", verdict: "no-row" });
        continue;
      }
      if (row.kind === "Automated") {
        if (!input.exercised.has(tid)) {
          findings.push({ reqId, tid, kind: row.kind, verdict: "automated-unexercised" });
        }
      } else if (row.kind === "Manual") {
        // A null text means DECISIONS.md is absent: skip, never re-label.
        if (input.decisionsText === null) continue;
        // \b-anchored, so T84 is not satisfied by T84e.
        if (!new RegExp(`\\b${tid}\\b`).test(input.decisionsText)) {
          findings.push({ reqId, tid, kind: row.kind, verdict: "manual-undocumented" });
        }
      } else {
        findings.push({ reqId, tid, kind: row.kind, verdict: "unknown-kind" });
      }
    }
  }
  return findings;
}

// Reviewed dispositions for evidence-linkage rows that no committed artifact
// can assert. The set is closed in code and mirrored in the baseline file's
// `classes` array; a mismatch is a finding, so the file cannot quietly narrow
// the taxonomy. A row leaves the baseline only by gaining an asserting site or
// by a spec-side correction that removes it from the linkage report.
export const LINKAGE_CLASSES = [
  "server-drill",
  "build-time",
  "pattern-buffer-gap",
  "operator",
  "spec-conflict",
] as const;

export type LinkageClass = (typeof LINKAGE_CLASSES)[number];

export interface LinkageBaselineEntry {
  req: string;
  tid: string;
  class: string;
  evidence: string;
}

export interface LinkageBaselineDiff {
  unbaselined: LinkageFinding[];
  stale: string[];
  invalid: string[];
}

const linkageKey = (req: string, tid: string): string => `${req}|${tid}`;

// Only `automated-unexercised` is suppressible: a row with no Appendix F entry,
// an undocumented Manual row, or an unknown kind is a defect no baseline may
// waive. Entries are keyed by REQ and T-ID, so a newly citing REQ cannot ride an
// existing waiver.
export function diffLinkageBaseline(
  findings: readonly LinkageFinding[],
  entries: readonly LinkageBaselineEntry[],
): LinkageBaselineDiff {
  const diff: LinkageBaselineDiff = { unbaselined: [], stale: [], invalid: [] };
  const byKey = new Map<string, LinkageBaselineEntry>();
  for (const entry of entries) {
    const key = linkageKey(entry.req, entry.tid);
    if (!entry.req || !entry.tid) {
      diff.invalid.push(`${key} — entry must carry both 'req' and 'tid'`);
      continue;
    }
    if (byKey.has(key)) {
      diff.invalid.push(`${key} — duplicate baseline entry`);
      continue;
    }
    byKey.set(key, entry);
    if (!(LINKAGE_CLASSES as readonly string[]).includes(entry.class)) {
      diff.invalid.push(`${key} — disposition class '${entry.class}' is not one of ${LINKAGE_CLASSES.join(", ")}`);
    }
    if (entry.evidence.trim() === "") diff.invalid.push(`${key} — evidence is empty`);
  }
  const findingKeys = new Set<string>();
  for (const finding of findings) {
    const key = linkageKey(finding.reqId, finding.tid);
    findingKeys.add(key);
    if (finding.verdict !== "automated-unexercised") {
      diff.unbaselined.push(finding);
      continue;
    }
    const entry = byKey.get(key);
    // A present entry suppresses; an invalid entry errors on its own line, so
    // the finding is not double-reported here.
    if (!entry) diff.unbaselined.push(finding);
  }
  for (const key of byKey.keys()) if (!findingKeys.has(key)) diff.stale.push(key);
  return diff;
}

// T253 (REQ-211c) — a DECISIONS.md (6) evidence record must parse to the minimum
// field set without prose interpretation: workflow identifier, timestamp,
// environment pins, pass/fail status, and a sub-check enumeration. The record is
// the contiguous `- ` bullet run after each `@section evidence` marker (blank
// lines before and inside the run are tolerated); the required labels are exact
// bold labels, and bullets carrying other labels are ignored, so an extra bullet
// cannot satisfy a missing field.
const EVIDENCE_RECORD_LABELS = [
  "Workflow",
  "Timestamp",
  "Environment pins",
  "Commands and output",
  "Pass/fail",
  "Findings",
] as const;
const WORKFLOW_TOKEN_RE = /^(G0a|G0b|G[2-8]|H(?:1[0-8]|[1-9]))\b/;
const EVIDENCE_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})/;

export function checkEvidenceRecordContract(decisionsText: string | null): string[] {
  // Absent in a scratch checkout: skip rather than re-label, the same rule the
  // Manual-rule check follows (scripts/lib/req-checks.ts:891-892).
  if (decisionsText === null) return [];
  const issues: string[] = [];
  const lines = decisionsText.split("\n");
  const markers: number[] = [];
  for (let i = 0; i < lines.length; i++) if (/^@section evidence\b/.test(lines[i].trim())) markers.push(i);
  if (markers.length === 0) return ["T253 — holonovel/DECISIONS.md carries no `@section evidence` marker"];

  for (const at of markers) {
    let i = at + 1;
    while (i < lines.length && lines[i].trim() === "") i++;
    const run: string[] = [];
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") continue;
      if (/^- /.test(line)) { run.push(line); continue; }
      break;
    }
    const where = `evidence record at line ${at + 1}`;
    const fields = new Map<string, string>();
    for (const line of run) {
      const m = line.match(/^- \*\*([^*]+)\*\*\s+—\s+(.+)$/);
      if (!m) continue;
      const key = m[1].trim();
      const value = m[2].trim();
      if ((EVIDENCE_RECORD_LABELS as readonly string[]).includes(key) && !fields.has(key)) fields.set(key, value);
    }
    for (const label of EVIDENCE_RECORD_LABELS) {
      const value = fields.get(label);
      if (value === undefined || value === "") issues.push(`T253 — ${where} is missing a non-empty '${label}' field`);
    }
    const workflow = fields.get("Workflow");
    if (workflow !== undefined && workflow !== "" && !WORKFLOW_TOKEN_RE.test(workflow)) {
      issues.push(`T253 — ${where} has no canonical workflow token in 'Workflow' (${workflow.slice(0, 40)})`);
    }
    const timestamp = fields.get("Timestamp");
    if (timestamp !== undefined && timestamp !== "" && !EVIDENCE_TIMESTAMP_RE.test(timestamp)) {
      issues.push(`T253 — ${where} has a malformed 'Timestamp' (${timestamp.slice(0, 40)})`);
    }
    const passFail = fields.get("Pass/fail");
    if (passFail !== undefined && passFail !== "" && !/^(pass|fail)\b/i.test(passFail)) {
      issues.push(`T253 — ${where} has a 'Pass/fail' value that is neither pass nor fail (${passFail.slice(0, 40)})`);
    }
    const subChecks = run.filter((l) => /^- \*\*\([a-z]\) [^*]+\*\*\s+—\s+\S/.test(l));
    if (subChecks.length === 0) issues.push(`T253 — ${where} has no sub-check enumeration bullet`);
  }
  return issues;
}

