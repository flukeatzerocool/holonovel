// Local artifact registry (REQ-620). Scan-derived and deterministic: the
// catalog is recomputed from the artifact directories, never persisted, and
// carries no wall-clock value so two installations with the same artifacts
// produce equal listings.
//
// Kinds: Novel packs (<DATA_DIR>/novels/*.json), adventure modules
// (configured dirs plus <DATA_DIR>/adventures/*.md), ruleset packages
// (<DATA_DIR>/rulesets/*/manifest.json), and codex packs
// (<DATA_DIR>/codex/*.json). Integrity is recomputed from the artifact's own
// declaration (REQ-092, REQ-617, REQ-389b, REQ-621).

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { novelChecksumValid } from "./state.js";
import { canonicalJson } from "./state-hash.js";
import { parseAdventureProvenance, verifyAdventureProvenance } from "./adventure-provenance.js";

export type ArtifactKind = "novel" | "adventure" | "ruleset" | "codex";
export type ArtifactIntegrity = "verified" | "unverified" | "absent";

export interface ArtifactEntry {
  kind: ArtifactKind;
  slug: string;
  title: string;
  version: string | null;
  content_hash: string | null;
  creator: string | null;
  attribution: string | null;
  license: string | null;
  integrity: ArtifactIntegrity;
  location: string;
}

export interface RulesetRecord {
  slug: string;
  manifest: {
    name?: string;
    host_version?: string;
    content_hash?: string;
    creator?: string;
    attribution?: string;
    source_license?: string;
  };
  dir: string;
}

export interface RegistrySources {
  novelsDir: string;
  adventureDirs: string[];
  codexDir: string;
  rulesets: () => RulesetRecord[];
  // Recomputes a package's content hash from its five payload files. Throws on
  // a missing or unreadable file so the entry reports a non-verified state.
  rulesetHash: (dir: string) => string;
}

const KIND_ORDER: ArtifactKind[] = ["novel", "adventure", "ruleset", "codex"];

export function buildArtifactRegistry(sources: RegistrySources): ArtifactEntry[] {
  const entries: ArtifactEntry[] = [
    ...scanNovels(sources.novelsDir),
    ...scanAdventures(sources.adventureDirs),
    ...scanRulesets(sources),
    ...scanCodexPacks(sources.codexDir),
  ];
  return entries.sort((a, b) =>
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.slug.localeCompare(b.slug),
  );
}

function scanNovels(dir: string): ArtifactEntry[] {
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    // Absent novels directory: nothing installed yet.
    return [];
  }
  const out: ArtifactEntry[] = [];
  for (const file of files) {
    const location = path.join(dir, file);
    let data: any;
    try {
      data = JSON.parse(fs.readFileSync(location, "utf-8"));
    } catch {
      out.push({
        kind: "novel",
        slug: file.slice(0, -".json".length),
        title: file.slice(0, -".json".length),
        version: null,
        content_hash: null,
        creator: null,
        attribution: null,
        license: null,
        integrity: "unverified",
        location,
      });
      continue;
    }
    const provenance = data?.metadata?.provenance ?? {};
    out.push({
      kind: "novel",
      slug: String(data?.slug ?? file.slice(0, -".json".length)),
      title: String(data?.name ?? data?.slug ?? file.slice(0, -".json".length)),
      version: typeof data?.spec_version === "string" ? data.spec_version : null,
      content_hash: typeof provenance?.content_hash === "string" ? provenance.content_hash : null,
      creator: typeof provenance?.creator === "string" ? provenance.creator : null,
      attribution: typeof provenance?.attribution === "string" ? provenance.attribution : null,
      license: typeof provenance?.license === "string" ? provenance.license : null,
      // A save with no checksum carries no integrity claim; report `absent`
      // rather than claiming it "verified" (matches adventure/ruleset entries).
      integrity: typeof data?._checksum === "string" ? (novelChecksumValid(data) ? "verified" : "unverified") : "absent",
      location,
    });
  }
  return out;
}

function scanAdventures(dirs: string[]): ArtifactEntry[] {
  const seen = new Set<string>();
  const out: ArtifactEntry[] = [];
  for (const dir of dirs) {
    let files: string[];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
    } catch {
      continue;
    }
    for (const file of files) {
      const slug = file.slice(0, -".md".length);
      if (seen.has(slug)) continue;
      seen.add(slug);
      const location = path.join(dir, file);
      let content: string;
      try {
        content = fs.readFileSync(location, "utf-8");
      } catch {
        continue;
      }
      const { provenance, body } = parseAdventureProvenance(content);
      const checks = verifyAdventureProvenance(provenance ?? {}, body);
      const declared = typeof provenance?.content_hash === "string" ? provenance.content_hash : null;
      out.push({
        kind: "adventure",
        slug,
        title: content.match(/^# (.+)$/m)?.[1] ?? slug,
        version: null,
        content_hash: declared,
        creator: provenance?.creator ?? null,
        attribution: provenance?.attribution ?? null,
        license: provenance?.license ?? null,
        integrity: !provenance || !declared ? "absent" : checks.failures.length > 0 ? "unverified" : "verified",
        location,
      });
    }
  }
  return out;
}

function scanRulesets(sources: RegistrySources): ArtifactEntry[] {
  let records: RulesetRecord[];
  try {
    records = sources.rulesets();
  } catch {
    return [];
  }
  return records.map(({ slug, manifest, dir }) => {
    const declared = typeof manifest.content_hash === "string" ? manifest.content_hash : null;
    let integrity: ArtifactIntegrity = "absent";
    if (declared) {
      try {
        integrity = sources.rulesetHash(dir) === declared ? "verified" : "unverified";
      } catch {
        integrity = "unverified";
      }
    }
    return {
      kind: "ruleset" as const,
      slug,
      title: manifest.name ?? slug,
      version: manifest.host_version ?? null,
      content_hash: declared,
      creator: manifest.creator ?? null,
      attribution: manifest.attribution ?? null,
      license: manifest.source_license ?? null,
      integrity,
      location: dir,
    };
  });
}

// REQ-621 — a codex pack is the `holonovel.codex/1` export payload. The hash is
// taken over `{schema, entries}` with entries ordered by id, so two packs
// carrying equal entries hash equally regardless of payload order; a declared
// top-level `content_hash` is compared against it and never fed back into it.
export function codexPackHash(entries: readonly unknown[]): string {
  const ordered = [...entries].sort((a: any, b: any) =>
    String(a?.id ?? "").localeCompare(String(b?.id ?? "")),
  );
  return createHash("sha256")
    .update(canonicalJson({ schema: "holonovel.codex/1", entries: ordered }))
    .digest("hex");
}

function scanCodexPacks(dir: string): ArtifactEntry[] {
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    // Absent pack directory: nothing installed yet.
    return [];
  }
  const out: ArtifactEntry[] = [];
  for (const file of files) {
    const location = path.join(dir, file);
    const slug = file.slice(0, -".json".length);
    let data: any;
    try {
      data = JSON.parse(fs.readFileSync(location, "utf-8"));
    } catch {
      out.push({
        kind: "codex",
        slug,
        title: slug,
        version: null,
        content_hash: null,
        creator: null,
        attribution: null,
        license: null,
        integrity: "unverified",
        location,
      });
      continue;
    }
    const entries = Array.isArray(data?.entries) ? data.entries : null;
    const wellFormed = data?.schema === "holonovel.codex/1" && entries !== null && entries.length > 0;
    const declared = typeof data?.content_hash === "string" ? data.content_hash : null;
    const hash = wellFormed ? codexPackHash(entries!) : null;
    const provenance = data?.provenance && typeof data.provenance === "object" ? data.provenance : {};
    out.push({
      kind: "codex",
      slug,
      title: typeof data?.title === "string" && data.title.trim() ? data.title : slug,
      version: null,
      content_hash: hash,
      creator: typeof provenance.creator === "string" ? provenance.creator : null,
      attribution: typeof provenance.attribution === "string" ? provenance.attribution : null,
      license: typeof provenance.license === "string" ? provenance.license : null,
      integrity: hash === null ? "unverified" : declared === null ? "absent" : declared === hash ? "verified" : "unverified",
      location,
    });
  }
  return out;
}

export function registryCounts(entries: ArtifactEntry[]): Record<ArtifactKind, number> {
  const counts: Record<ArtifactKind, number> = { novel: 0, adventure: 0, ruleset: 0, codex: 0 };
  for (const entry of entries) counts[entry.kind]++;
  return counts;
}
