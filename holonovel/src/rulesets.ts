// Ruleset package manager — declarative ruleset packages (REQ-389, REQ-390).
//
// A ruleset package is a self-contained declarative artifact in the install
// directory (REQ-389): six JSON files — manifest.json, index.json, model.json,
// tools.json, resources.json, prompts.json. The host loads a package without
// reading or re-parsing ruleset Markdown source, using only the prebuilt index
// and model the package ships.

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createRng, sessionRoll } from "./core/rng.js";
import { PACKAGE_FORMAT } from "./generated/contract-fingerprints.js";

export interface RulesetManifest {
  slug: string;
  name: string;
  host_version: string;
  // REQ-420 — the package-format fingerprint (spec-derived content hash of
  // §5.16, §5.17, §6.3, §6.4.2) is the host's compatibility signal. A package
  // whose fingerprint differs from — or is absent from — the host's current
  // value is held inactive rather than dropped (REQ-393).
  package_format: string;
  content_hash: string;
  built_at: string;
  counts: Record<string, number>;
}

export interface RulesetIndexEntry {
  id: string;
  anchor: string;
  source_file: string;
  content: string;
  category: string;
  confidence: string;
}

export interface RulesetToolSchema {
  name: string;
  title: string;
  description: string;
  kind: "lookup" | "search" | "roll" | "table" | "info";
  collection?: string;
  inputSchema: any;
}

export interface RulesetPrompt {
  name: string;
  title?: string;
  text: string;
  [key: string]: any;
}

export interface RulesetPackage {
  slug: string;
  manifest: RulesetManifest;
  index: RulesetIndexEntry[];
  model: Record<string, Record<string, any>>;
  tools: RulesetToolSchema[];
  resources: any[];
  prompts: RulesetPrompt[];
}

export interface RollResult {
  total: number;
  dice: number[];
  modifier: number;
  notation: string;
}

// The content hash covers the canonical JSON of the five content files,
// concatenated in this fixed order (REQ-389). "Canonical" is minified JSON
// with the properties serialized exactly as they appear in the source object.
export function computeContentHash(
  index: any[],
  model: any,
  tools: any[],
  resources: any[],
  prompts: any[],
): string {
  const canonical = (obj: any) => JSON.stringify(JSON.parse(JSON.stringify(obj)));
  const h = crypto.createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) {
    h.update(canonical(obj));
  }
  return h.digest("hex");
}

// NdM[+|-X] dice parser. Returns total, per-die results, and modifier.
// Accepts an optional seed for a deterministic isolated draw (REQ-050).
export function rollDice(notation: string, seed?: string): RollResult {
  const m = String(notation).trim().match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
  if (!m) {
    throw new Error(`Invalid dice notation '${notation}'. Use NdM, e.g. 1d20, 3d6, 4d6+2.`);
  }
  const count = parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  if (count < 1 || count > 1000 || sides < 2 || sides > 100000) {
    throw new Error(`Dice notation '${notation}' out of range.`);
  }
  const dice: number[] = [];
  if (seed !== undefined) {
    const rng = createRng(seed);
    for (let i = 0; i < count; i++) dice.push(rng.roll(sides));
  } else {
    for (let i = 0; i < count; i++) dice.push(sessionRoll(sides));
  }
  const sign = m[3] === "-" ? -1 : 1;
  const modifier = m[4] ? sign * parseInt(m[4], 10) : 0;
  const total = dice.reduce((a, b) => a + b, 0) + modifier;
  return { total, dice, modifier, notation: notation.trim() };
}

// REQ-430 — ruleset tool-quality conformance: every package tool schema SHALL
// carry a title, a three-clause description (REQ-024a), and a description on
// every input parameter (REQ-427). Returns the list of defects (empty = conformant).
export function validateToolSchema(schema: RulesetToolSchema): string[] {
  const defects: string[] = [];
  if (!schema.title || String(schema.title).trim() === "") defects.push("missing title");
  const desc = String(schema.description ?? "");
  if (!desc.includes("Use when")) defects.push("description missing 'Use when'");
  if (!desc.includes("Do NOT use")) defects.push("description missing 'Do NOT use'");
  const props = schema?.inputSchema?.properties;
  if (props && typeof props === "object") {
    for (const [key, value] of Object.entries(props)) {
      const p = value as any;
      if (!p || typeof p.description !== "string" || p.description.trim() === "") {
        defects.push(`parameter '${key}' missing description`);
      }
    }
  }
  return defects;
}

// REQ-389 — declarative ruleset packages (six JSON files, content-hash
// validated); REQ-390 — lazy hydration on first use, eager via TTRPG_RULESETS;
// REQ-393 — update preservation: packages revalidate against the host's current
// package-format fingerprint (REQ-420) and are held inactive with a
// [package-incompatible] flag rather than dropped.
export class RulesetManager {
  readonly installDir: string;
  private installed = new Map<string, RulesetManifest>();
  private incompatible = new Map<string, { slug: string; reason: string }>();
  private hydrated = new Map<string, RulesetPackage>();
  // REQ-430 — per-package tool-quality results computed at hydration: the count
  // of conformant tool schemas and the list of non-conformant ones with defects.
  private toolQuality = new Map<string, { conformant: number; alerts: { tool: string; defects: string[] }[] }>();

  constructor(installDir: string) {
    this.installDir = installDir;
  }

  // Scan the install directory and record installed package metadata, WITHOUT
  // loading index/model (lazy hydration — REQ-390). Returns an array of
  // per-slug validation errors (empty means clean). A package whose
  // package-format fingerprint differs from the host's current value is held
  // inactive with a [package-incompatible] flag (REQ-420, REQ-393).
  scan(): string[] {
    this.installed.clear();
    this.incompatible.clear();
    this.toolQuality.clear();
    const errors: string[] = [];
    if (!fs.existsSync(this.installDir)) return errors;
    const entries = fs.readdirSync(this.installDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      const manifestPath = path.join(this.installDir, slug, "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        errors.push(`${slug}: missing manifest.json`);
        continue;
      }
      try {
        const manifest: RulesetManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        if (manifest.slug !== slug) {
          errors.push(`${slug}: manifest slug mismatch ('${manifest.slug}')`);
          continue;
        }
        if (!manifest.package_format || manifest.package_format !== PACKAGE_FORMAT) {
          const reason = manifest.package_format
            ? `package-format fingerprint mismatch ('${manifest.package_format}' != '${PACKAGE_FORMAT}')`
            : "missing package-format fingerprint";
          // REQ-420 — the flag is surfaced in spec_health naming the slug and
          // both fingerprints, not only on stderr.
          this.incompatible.set(slug, { slug, reason: `[package-incompatible] ${reason}` });
          errors.push(`${slug}: ${this.incompatible.get(slug)!.reason}`);
          continue;
        }
        this.installed.set(slug, manifest);
      } catch (e: any) {
        errors.push(`${slug}: unreadable manifest — ${e.message}`);
      }
    }
    return errors;
  }

  installedSlugs(): string[] {
    return [...this.installed.keys()];
  }

  // REQ-420 — incompatible packages are reported in spec_health, held inactive,
  // and never silently dropped (REQ-393).
  incompatibleSlugs(): { slug: string; reason: string }[] {
    return [...this.incompatible.values()];
  }

  // REQ-430 — non-conformant ruleset-derived tools, surfaced in spec_health
  // naming slug, tool, and defects. Only hydrated packages are validated
  // (validation happens at load, i.e. at hydration).
  toolQualityAlerts(): { slug: string; tool: string; defects: string[] }[] {
    const out: { slug: string; tool: string; defects: string[] }[] = [];
    for (const [slug, q] of this.toolQuality) {
      for (const a of q.alerts) out.push({ slug, tool: a.tool, defects: a.defects });
    }
    return out;
  }

  toolQualityCounts(): { conformant: number; non_conformant: number } {
    let conformant = 0;
    let nonConformant = 0;
    for (const q of this.toolQuality.values()) {
      conformant += q.conformant;
      nonConformant += q.alerts.length;
    }
    return { conformant, non_conformant: nonConformant };
  }

  isInstalled(slug: string): boolean {
    return this.installed.has(slug);
  }

  isHydrated(slug: string): boolean {
    return this.hydrated.has(slug);
  }

  prefixMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const slug of this.installed.keys()) map[slug] = slug;
    return map;
  }

  // Load a package fully (index + model + tools + resources + prompts) after
  // validating its content hash against the host algorithm. Returns the loaded
  // package, cached for subsequent calls.
  hydrate(slug: string): RulesetPackage {
    if (this.hydrated.has(slug)) return this.hydrated.get(slug)!;
    const manifest = this.installed.get(slug);
    if (!manifest) {
      throw new Error(`Ruleset '${slug}' is not installed.`);
    }
    const dir = path.join(this.installDir, slug);
    const read = (name: string): any => {
      const p = path.join(dir, name);
      if (!fs.existsSync(p)) throw new Error(`Ruleset '${slug}' is missing ${name}.`);
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    };
    const index = read("index.json");
    const model = read("model.json");
    const tools = read("tools.json");
    const resources = read("resources.json");
    const prompts = read("prompts.json");
    const hash = computeContentHash(index, model, tools, resources, prompts);
    if (hash !== manifest.content_hash) {
      throw new Error(
        `Ruleset '${slug}' content hash mismatch. Expected ${manifest.content_hash}, received ${hash}.`,
      );
    }
    const pkg: RulesetPackage = { slug, manifest, index, model, tools, resources, prompts };
    this.hydrated.set(slug, pkg);
    // REQ-430 — validate tool schemas at load; non-conformant tools stay
    // registered but are flagged in spec_health (never block package loading).
    const alerts: { tool: string; defects: string[] }[] = [];
    let conformant = 0;
    for (const schema of pkg.tools) {
      const defects = validateToolSchema(schema);
      if (defects.length === 0) conformant++;
      else alerts.push({ tool: schema.name, defects });
    }
    this.toolQuality.set(slug, { conformant, alerts });
    return pkg;
  }

  toolSchemas(slug: string): RulesetToolSchema[] {
    const pkg = this.hydrate(slug);
    return pkg.tools;
  }

  // Full-text search over the hydrated index. Simple normalized substring
  // scoring across id/anchor/content/category.
  search(slug: string, query: string, maxResults: number = 10): RulesetIndexEntry[] {
    const pkg = this.hydrate(slug);
    const q = query.trim().toLowerCase();
    if (!q) return pkg.index.slice(0, maxResults);
    const scored: { entry: RulesetIndexEntry; score: number }[] = [];
    for (const entry of pkg.index) {
      const hay = `${entry.id} ${entry.anchor} ${entry.category} ${entry.content}`.toLowerCase();
      let score = 0;
      if (hay.includes(q)) score += 10;
      for (const term of q.split(/\s+/)) {
        if (term && hay.includes(term)) score += 2;
      }
      if (entry.id.includes(q) || entry.anchor.toLowerCase().includes(q)) score += 5;
      if (score > 0) scored.push({ entry, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map((s) => s.entry);
  }

  // Install a package bundle (the six files) under the install dir, validating
  // slug uniqueness, host-version compatibility, and content-hash integrity.
  installPackage(slug: string, files: Record<string, any>): RulesetPackage {
    if (this.installed.has(slug)) {
      throw new Error(`[STATE_CONFLICT] Ruleset '${slug}' is already installed.`);
    }
    const manifest: RulesetManifest = files.manifest;
    if (!manifest || manifest.slug !== slug) {
      throw new Error(`[INVALID_INPUT] manifest.slug must equal '${slug}'.`);
    }
    if (!manifest.package_format || manifest.package_format !== PACKAGE_FORMAT) {
      throw new Error(`[INVALID_INPUT] incompatible package-format fingerprint '${manifest.package_format}' (expected '${PACKAGE_FORMAT}').`);
    }
    const hash = computeContentHash(
      files.index ?? [],
      files.model ?? {},
      files.tools ?? [],
      files.resources ?? [],
      files.prompts ?? [],
    );
    if (hash !== manifest.content_hash) {
      throw new Error(`[INVALID_INPUT] content hash mismatch. Expected ${manifest.content_hash}, received ${hash}.`);
    }
    const dir = path.join(this.installDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, obj] of Object.entries({
      "manifest.json": files.manifest,
      "index.json": files.index ?? [],
      "model.json": files.model ?? {},
      "tools.json": files.tools ?? [],
      "resources.json": files.resources ?? [],
      "prompts.json": files.prompts ?? [],
    })) {
      fs.writeFileSync(path.join(dir, name), JSON.stringify(obj, null, 2) + "\n");
    }
    this.scan();
    return this.hydrate(slug);
  }

  removePackage(slug: string): void {
    if (!this.installed.has(slug)) {
      throw new Error(`[STATE_CONFLICT] Ruleset '${slug}' is not installed.`);
    }
    const dir = path.join(this.installDir, slug);
    fs.rmSync(dir, { recursive: true, force: true });
    this.installed.delete(slug);
    this.hydrated.delete(slug);
    this.toolQuality.delete(slug);
  }
}
