#!/usr/bin/env npx tsx
/**
 * ruleset-supplement.ts — supplement overlay and provenance helpers
 * (REQ-395a, REQ-421, REQ-557). [build tool]
 *
 * Pure part-level helpers for a supplement build: read the five durable parts,
 * merge a supplement onto a base by key (replace, never append), hash the parts
 * the same way the package emitter does, and freeze a base snapshot for
 * deterministic re-overlay. No filesystem mutation beyond the exported calls.
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface PackageParts {
  index: any[];
  model: Record<string, any>;
  tools: any[];
  resources: any[];
  prompts: any[];
}

export const PARTS_FILES = ["index.json", "model.json", "tools.json", "resources.json", "prompts.json"] as const;

export function readParts(dir: string): PackageParts {
  const read = (file: string) => JSON.parse(readFileSync(join(dir, file), "utf-8"));
  return {
    index: read("index.json"),
    model: read("model.json"),
    tools: read("tools.json"),
    resources: read("resources.json"),
    prompts: read("prompts.json"),
  };
}

// A supplement is a durable parts directory when all five files are present.
// A Markdown-only directory needs extraction and is recorded, not overlaid.
export function readSupplementParts(dir: string): PackageParts | null {
  if (!PARTS_FILES.every((file) => existsSync(join(dir, file)))) return null;
  return readParts(dir);
}

const keyOf = (entry: any, kind: "index" | "tools" | "resources" | "prompts"): string =>
  kind === "index" ? String(entry?.id ?? entry?.anchor ?? "")
    : kind === "resources" ? String(entry?.uri ?? entry?.name ?? "")
      : String(entry?.name ?? "");

// Replace-by-key: a supplement entry replaces a base entry in place, a new
// entry appends. Re-running with unchanged sources is therefore idempotent and
// never duplicates prior supplement content (REQ-557).
function mergeList(base: any[], supplement: any[], kind: "index" | "tools" | "resources" | "prompts"): any[] {
  const out = [...base];
  for (const entry of supplement) {
    const key = keyOf(entry, kind);
    const at = out.findIndex((existing) => keyOf(existing, kind) === key);
    if (at >= 0) out[at] = entry;
    else out.push(entry);
  }
  return out;
}

function mergeModel(base: Record<string, any>, supplement: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...base };
  for (const [topKey, value] of Object.entries(supplement)) {
    const prior = out[topKey];
    if (value && typeof value === "object" && !Array.isArray(value)
      && prior && typeof prior === "object" && !Array.isArray(prior)) {
      out[topKey] = { ...prior, ...value };
    } else {
      out[topKey] = value;
    }
  }
  return out;
}

export function mergeParts(base: PackageParts, supplements: PackageParts[]): PackageParts {
  let merged: PackageParts = { ...base, index: [...base.index], tools: [...base.tools], resources: [...base.resources], prompts: [...base.prompts] };
  for (const supplement of supplements) {
    merged = {
      index: mergeList(merged.index, supplement.index, "index"),
      model: mergeModel(merged.model, supplement.model),
      tools: mergeList(merged.tools, supplement.tools, "tools"),
      resources: mergeList(merged.resources, supplement.resources, "resources"),
      prompts: mergeList(merged.prompts, supplement.prompts, "prompts"),
    };
  }
  return merged;
}

export function writeParts(dir: string, parts: PackageParts): void {
  mkdirSync(dir, { recursive: true });
  for (const file of PARTS_FILES) {
    const value = parts[file.replace(".json", "") as keyof PackageParts];
    writeFileSync(join(dir, file), JSON.stringify(value, null, 2) + "\n");
  }
}

// REQ-557/REQ-561 — the same canonical hash the emitter computes, over the five
// parts only.
export function hashParts(parts: PackageParts): string {
  const canonical = (obj: unknown) => JSON.stringify(JSON.parse(JSON.stringify(obj)));
  const h = createHash("sha256");
  for (const obj of [parts.index, parts.model, parts.tools, parts.resources, parts.prompts]) h.update(canonical(obj));
  return h.digest("hex");
}

// Per-file SHA-256 of a supplement source, recorded so a source change is
// visible in the registry and the provenance log.
export function hashSourceDir(dir: string): string[] {
  const hashes: string[] = [];
  const walk = (current: string, prefix: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = join(current, entry.name);
      if (entry.isDirectory()) walk(abs, rel);
      else hashes.push(`${createHash("sha256").update(readFileSync(abs)).digest("hex")}  ${rel}`);
    }
  };
  walk(dir, "");
  return hashes.sort();
}

// Freeze the pre-overlay base parts. The snapshot is the rebuild input only;
// drift is measured against the base's current emission (REQ-557).
export function snapshotBase(dataDir: string, installDir: string, slug: string): string {
  const target = join(dataDir, "ruleset-bases", slug);
  if (existsSync(join(target, "index.json"))) return target;
  mkdirSync(target, { recursive: true });
  for (const file of PARTS_FILES) cpSync(join(installDir, slug, file), join(target, file));
  return target;
}
