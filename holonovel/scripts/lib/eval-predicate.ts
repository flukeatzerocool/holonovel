// eval-predicate.ts — resolve a finding's `file:line` predicate.
//
// A predicate is only evidence if it points at real code. This library rejects
// paths outside the repo, missing files, out-of-range lines, and lines that are
// empty, comment-only, or a lone closing brace. It checks existence, range, and
// plausibility — not symbol identity; symbol anchors are a recorded follow-up.
// Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support.

import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

export interface PredicateResolution {
  ok: boolean;
  reason: string;
  path?: string;
  line?: number;
}

/** Split `path:line`; returns null when the shape is wrong. */
export function parsePredicate(predicate: string): { path: string; line: number } | null {
  const match = /^(.+):(\d+)$/.exec(predicate.trim());
  if (!match) return null;
  const line = Number.parseInt(match[2]!, 10);
  if (!Number.isFinite(line) || line < 1) return null;
  return { path: match[1]!, line };
}

/** Resolve a predicate against a repo root. */
export function resolvePredicate(predicate: string, root: string): PredicateResolution {
  const parsed = parsePredicate(predicate);
  if (!parsed) return { ok: false, reason: `not a file:line predicate: ${predicate}` };
  if (parsed.path.includes("..")) return { ok: false, reason: `path escapes the repo: ${parsed.path}` };
  const absolute = resolve(root, parsed.path);
  const prefix = resolve(root) + sep;
  if (absolute !== resolve(root) && !absolute.startsWith(prefix)) {
    return { ok: false, reason: `path escapes the repo: ${parsed.path}` };
  }
  if (!existsSync(absolute)) return { ok: false, reason: `file does not exist: ${parsed.path}`, path: parsed.path, line: parsed.line };
  let text: string;
  try {
    text = readFileSync(absolute, "utf-8");
  } catch {
    // Unreadable file: treat as unresolved so the finding is not silently lost.
    return { ok: false, reason: `file is unreadable: ${parsed.path}`, path: parsed.path, line: parsed.line };
  }
  const lines = text.split(/\r?\n/);
  if (parsed.line > lines.length) {
    return { ok: false, reason: `line ${parsed.line} is past EOF (${lines.length} lines): ${parsed.path}`, path: parsed.path, line: parsed.line };
  }
  const source = lines[parsed.line - 1]!.trim();
  if (source.length === 0) return { ok: false, reason: `line ${parsed.line} is empty: ${parsed.path}`, path: parsed.path, line: parsed.line };
  if (/^[})\];,]+$/.test(source)) return { ok: false, reason: `line ${parsed.line} is a closing delimiter: ${parsed.path}`, path: parsed.path, line: parsed.line };
  if (/^(\/\/|\/\*|\*)/.test(source)) return { ok: false, reason: `line ${parsed.line} is a comment: ${parsed.path}`, path: parsed.path, line: parsed.line };
  return { ok: true, reason: "resolved", path: parsed.path, line: parsed.line };
}
