// REQ-659 — slug derivation. A slug is a filename-safe identifier for a Novel
// save file: lowercase, `[^a-z0-9]+` collapsed to hyphens, hyphens trimmed —
// the same core rule the create/rename sanitizer has always used, so existing
// names keep their slugs. Two additions per §7.1a: a Windows reserved device
// stem resolves by appending `-1`, and a primary state path longer than 240
// characters is shortened by prefixing a short hash of the slug. An empty
// derivation falls back to a fixed stem rather than producing `novels/.json`.
// Every result satisfies `isSafeSlug` (core/data-dir.ts).

import { createHash } from "node:crypto";
import * as path from "node:path";

/** §7.1a — the primary Novel state path ceiling, in characters. */
export const SLUG_PATH_CEILING = 240;

/** Windows reserved device stems (case-insensitive); `CON.json` is reserved too. */
const RESERVED_STEMS = new Set([
  "con", "prn", "aux", "nul",
  "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
  "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
]);

const FALLBACK_STEM = "novel";

/** REQ-659 — true when a slug stem names a Windows reserved device. */
export function isReservedSlugStem(slug: string): boolean {
  return RESERVED_STEMS.has(slug.toLowerCase());
}

/**
 * REQ-659 — derive a slug from a human name: core sanitizer, reserved-stem
 * remap, empty-name fallback. Deterministic and independent of the data
 * directory; `fitSlug` applies the path ceiling on top.
 */
export function deriveSlug(name: string): string {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return FALLBACK_STEM;
  return isReservedSlugStem(base) ? `${base}-1` : base;
}

/**
 * REQ-659 — fit a slug to the 240-character primary-path ceiling. Returns the
 * **slug**, never a path: the result is what `novel.slug`, the `novels` map
 * key, and the save-file stem all use. When the input already fits, it is
 * returned unchanged; otherwise an 8-hex-character hash prefix of the input is
 * prepended and the input is truncated from the end until the path fits. The
 * trailing hyphen trim keeps the result `isSafeSlug`-clean.
 */
export function fitSlug(slug: string, stateDir: string, ext = ".json"): string {
  const pathLength = (candidate: string) =>
    path.join(stateDir, "novels", `${candidate}${ext}`).length;
  if (pathLength(slug) <= SLUG_PATH_CEILING) return slug;
  const prefix = createHash("sha256").update(slug).digest("hex").slice(0, 8);
  let body = slug;
  while (body.length > 0 && pathLength(`${prefix}-${body}`) > SLUG_PATH_CEILING) {
    body = body.slice(0, -1);
  }
  return `${prefix}-${body}`.replace(/-+$/g, "");
}
