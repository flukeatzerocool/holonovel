// eval-state.ts — deterministic persisted-Novel lookup for the Holosuite tiers.
//
// A fresh data directory seeds the starter Novel alongside the tier's own
// Novel, so reading `novels/*.json[0]` is not hermetic (file order is not
// identity). These helpers select a Novel by its persisted name or slug and
// sort the directory scan, so every tier reads exactly the Novel it created.
// Pure I/O; no oracle logic. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** All persisted Novels in a data directory, in sorted filename order. */
export function persistedNovels(dataDir: string): Array<Record<string, unknown>> {
  const dir = join(dataDir, "novels");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")) as Record<string, unknown>);
}

/** Read the one persisted Novel whose `name` or `slug` matches. */
export function readPersistedNovel(dataDir: string, nameOrSlug: string): Record<string, unknown> {
  for (const novel of persistedNovels(dataDir)) {
    if (novel.name === nameOrSlug || novel.slug === nameOrSlug) return novel;
  }
  throw new Error(`novel '${nameOrSlug}' not persisted in ${dataDir}`);
}
