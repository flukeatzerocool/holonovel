// eval-predicate.ts — resolve a finding's `file:line#symbol` predicate.
//
// A predicate is only evidence if it points at the code it claims. The anchor
// shape is `path:line#symbol`: the line must exist, be in range, be executable
// (not empty, a lone closing delimiter, or a comment), and contain `symbol` as
// an identifier token. The symbol check closes the drift class where a stale
// line number still lands on unrelated code and the citation silently lies.
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
  symbol?: string;
}

/** Build a predicate anchor from its parts. */
export function anchor(path: string, line: number, symbol: string): string {
  return `${path}:${line}#${symbol}`;
}

/** Split `path:line#symbol`; returns null when the shape is wrong. */
export function parsePredicate(predicate: string): { path: string; line: number; symbol: string } | null {
  const match = /^(.+):(\d+)#([A-Za-z_$][\w$]*)$/.exec(predicate.trim());
  if (!match) return null;
  const line = Number.parseInt(match[2]!, 10);
  if (!Number.isFinite(line) || line < 1) return null;
  return { path: match[1]!, line, symbol: match[3]! };
}

/** Escape a symbol for a literal RegExp match. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve a predicate against a repo root. */
export function resolvePredicate(predicate: string, root: string): PredicateResolution {
  const parsed = parsePredicate(predicate);
  if (!parsed) {
    return { ok: false, reason: `not a path:line#symbol predicate: ${predicate}` };
  }
  if (parsed.path.includes("..")) return { ok: false, reason: `path escapes the repo: ${parsed.path}` };
  const absolute = resolve(root, parsed.path);
  const prefix = resolve(root) + sep;
  if (absolute !== resolve(root) && !absolute.startsWith(prefix)) {
    return { ok: false, reason: `path escapes the repo: ${parsed.path}`, path: parsed.path, line: parsed.line, symbol: parsed.symbol };
  }
  if (!existsSync(absolute)) {
    return { ok: false, reason: `file does not exist: ${parsed.path}`, path: parsed.path, line: parsed.line, symbol: parsed.symbol };
  }
  let text: string;
  try {
    text = readFileSync(absolute, "utf-8");
  } catch {
    // Unreadable file: treat as unresolved so the finding is not silently lost.
    return { ok: false, reason: `file is unreadable: ${parsed.path}`, path: parsed.path, line: parsed.line, symbol: parsed.symbol };
  }
  const lines = text.split(/\r?\n/);
  if (parsed.line > lines.length) {
    return { ok: false, reason: `line ${parsed.line} is past EOF (${lines.length} lines): ${parsed.path}`, path: parsed.path, line: parsed.line, symbol: parsed.symbol };
  }
  const source = lines[parsed.line - 1]!.trim();
  if (source.length === 0) {
    return { ok: false, reason: `line ${parsed.line} is empty: ${parsed.path}`, path: parsed.path, line: parsed.line, symbol: parsed.symbol };
  }
  if (/^[})\];,]+$/.test(source)) {
    return { ok: false, reason: `line ${parsed.line} is a closing delimiter: ${parsed.path}`, path: parsed.path, line: parsed.line, symbol: parsed.symbol };
  }
  if (/^(\/\/|\/\*|\*)/.test(source)) {
    return { ok: false, reason: `line ${parsed.line} is a comment: ${parsed.path}`, path: parsed.path, line: parsed.line, symbol: parsed.symbol };
  }
  if (!new RegExp(`\\b${escapeRegExp(parsed.symbol)}\\b`).test(source)) {
    return {
      ok: false,
      reason: `line ${parsed.line} does not contain '${parsed.symbol}': ${parsed.path}`,
      path: parsed.path,
      line: parsed.line,
      symbol: parsed.symbol,
    };
  }
  return { ok: true, reason: "resolved", path: parsed.path, line: parsed.line, symbol: parsed.symbol };
}
