#!/usr/bin/env npx tsx
/**
 * check-reference-server-cleanliness.ts — reference-server content boundary
 * (REQ-562 / governance). [gate]
 *
 * The reference server (this specification repository) ships its own reference
 * rulesets; no per-book build assets belong here — converted sources, build
 * tooling, and emitted packages live in the deploy content pipeline. This gate
 * fails when:
 *   (a) any tracked file under `scripts/ruleset-builds/` exists; or
 *   (b) a ruleset package triple (manifest.json + model.json + index.json) is
 *       tracked outside the sanctioned fixtures / gitignored build output; or
 *   (c) a vendored narrative corpus, its Appendix U row, and its attribution
 *       register row do not move together (license parity).
 *
 * Usage: npx tsx scripts/check-reference-server-cleanliness.ts
 * Exit codes: 0 = clean, 1 = violations.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Reference rulesets whose build assets are committed to this repository: none.
// Per-book assets live in the deploy content pipeline (see DECISIONS.md).
const SANCTIONED_PACKAGE_PREFIXES = ["holonovel/testdata/rulesets/"];

const root = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
const tracked = execSync("git ls-files", { cwd: root, encoding: "utf-8" }).trim().split("\n").filter(Boolean);

const violations: string[] = [];

// (a) build assets.
for (const f of tracked) {
  if (f.startsWith("scripts/ruleset-builds/")) {
    violations.push(`tracked ruleset build asset: ${f} — per-book build assets belong in the deploy content pipeline, not the reference server`);
  }
}

// (b) package triples outside sanctioned fixtures.
const triples = new Map<string, Set<string>>();
for (const f of tracked) {
  const m = f.match(/^(.*)\/(manifest|model|index|tools|resources|prompts)\.json$/);
  if (!m) continue;
  if (SANCTIONED_PACKAGE_PREFIXES.some((p) => f.startsWith(p))) continue;
  const dir = m[1];
  if (!triples.has(dir)) triples.set(dir, new Set());
  triples.get(dir)!.add(m[2]);
}
for (const [dir, files] of triples) {
  if (files.has("manifest") && files.has("model") && files.has("index")) {
    violations.push(`tracked ruleset package under ${dir}/ (manifest+model+index) — emitted packages belong in the install dir, not the repo`);
  }
}

// (c) license parity — a vendored narrative corpus, its Appendix U row, and its
// attribution-register row move together, in both directions. Adding or
// removing a source must update all three, so the footer, the table, and the
// due-diligence record cannot drift apart.
const NARRATIVE = join(root, "holonovel", "narrative_world_model", "narrative");
const APPENDIX_U = join(root, "spec", "appendices-licenses.md");
const ATTRIBUTION = join(root, "docs", "licenses", "ATTRIBUTION.md");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

if (existsSync(NARRATIVE) && existsSync(APPENDIX_U) && existsSync(ATTRIBUTION)) {
  const appendix = readFileSync(APPENDIX_U, "utf-8");
  const attribution = readFileSync(ATTRIBUTION, "utf-8");
  const rows = appendix.split("\n")
    .filter((l) => l.startsWith("| ") && !l.startsWith("| Source") && !l.startsWith("|---"))
    .map((l) => l.split("|").map((c) => c.trim()).filter(Boolean))
    .filter((c) => c.length === 4)
    .map(([source, kind]) => ({ source, kind }));
  const narrativeRows = rows.filter((r) => r.kind === "Narrative frameworks");
  const dirs = readdirSync(NARRATIVE, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);

  for (const dir of dirs) {
    const hasLicense = existsSync(join(NARRATIVE, dir, "LICENSE")) || existsSync(join(NARRATIVE, dir, "LICENSE.md"));
    if (!hasLicense) {
      violations.push(`vendored corpus ${dir}/ has no LICENSE file`);
      continue;
    }
    const dTokens = norm(dir).split(" ");
    const row = narrativeRows.find((r) => {
      const t = norm(r.source).split(" ");
      return dTokens.every((x) => t.includes(x));
    });
    if (!row) violations.push(`vendored corpus ${dir}/ has no Narrative-frameworks row in Appendix U`);
  }

  for (const r of narrativeRows) {
    if (!attribution.includes(r.source)) {
      violations.push(`Appendix U source "${r.source}" has no row in docs/licenses/ATTRIBUTION.md`);
    }
    const t = norm(r.source).split(" ");
    const dir = dirs.find((d) => norm(d).split(" ").every((x) => t.includes(x)));
    if (!dir) {
      violations.push(`Appendix U Narrative-frameworks row "${r.source}" has no vendored directory under narrative/`);
    }
  }
}

if (violations.length > 0) {
  for (const v of [...new Set(violations)]) console.error(`FAIL: ${v}`);
  console.error(`\n${violations.length} reference-server cleanliness violation(s)`);
  process.exit(1);
}
console.log("PASS: reference server carries no unsanctioned ruleset content");
process.exit(0);
