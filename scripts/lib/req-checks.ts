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
  if (start === -1 || end === -1 || end < start) return issues;
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
