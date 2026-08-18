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

export const HOST_VERSION = "2026.08.18";

export interface RulesetManifest {
  slug: string;
  name: string;
  host_version: string;
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
export function rollDice(notation: string): RollResult {
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
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * sides) + 1);
  }
  const sign = m[3] === "-" ? -1 : 1;
  const modifier = m[4] ? sign * parseInt(m[4], 10) : 0;
  const total = dice.reduce((a, b) => a + b, 0) + modifier;
  return { total, dice, modifier, notation: notation.trim() };
}

export class RulesetManager {
  readonly installDir: string;
  readonly hostVersion: string;
  private installed = new Map<string, RulesetManifest>();
  private hydrated = new Map<string, RulesetPackage>();

  constructor(installDir: string, hostVersion: string = HOST_VERSION) {
    this.installDir = installDir;
    this.hostVersion = hostVersion;
  }

  // Scan the install directory and record installed package metadata, WITHOUT
  // loading index/model (lazy hydration — REQ-390). Returns an array of
  // per-slug validation errors (empty means clean).
  scan(): string[] {
    this.installed.clear();
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
        if (manifest.host_version !== this.hostVersion) {
          errors.push(`${slug}: incompatible host_version '${manifest.host_version}' (expected '${this.hostVersion}')`);
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
    if (manifest.host_version !== this.hostVersion) {
      throw new Error(`[INVALID_INPUT] incompatible host_version '${manifest.host_version}' (expected '${this.hostVersion}').`);
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
  }
}
