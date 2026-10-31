// Adventure module provenance parsing and verification (REQ-616, REQ-617).
// Pure: shared by adventure load/list/resources and the artifact registry
// (REQ-620) so the block format and hash rule live in one place.

import * as crypto from "node:crypto";

export type AdventureProvenance = {
  creator?: string;
  attribution?: string;
  license?: string;
  content_hash?: string;
  signature?: string;
};

export const ADVENTURE_PROVENANCE_KEYS = new Set(["creator", "attribution", "license", "content_hash", "signature"]);

/** Constant-time string comparison for HMAC values; length mismatch is a
 *  mismatch and never reaches `timingSafeEqual` (which throws on it). */
export function hmacMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function parseAdventureProvenance(content: string): { provenance: AdventureProvenance | null; body: string } {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") return { provenance: null, body: content };
  // Appendix K — the block ends at the closing `---` before the first heading.
  // Scan to that heading (or EOF) rather than a fixed line cap so a long but
  // valid provenance block still parses.
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") { end = i; break; }
    if (/^#{1,6}\s/.test(lines[i])) break;
  }
  if (end < 0) return { provenance: null, body: content };
  const block: AdventureProvenance = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m || !ADVENTURE_PROVENANCE_KEYS.has(m[1])) return { provenance: null, body: content };
    (block as Record<string, string>)[m[1]] = m[2].trim();
  }
  if (Object.keys(block).length === 0) return { provenance: null, body: content };
  return { provenance: block, body: lines.slice(end + 1).join("\n") };
}

export function verifyAdventureProvenance(provenance: AdventureProvenance, body: string): { failures: string[]; warnings: string[] } {
  const failures: string[] = [];
  const warnings: string[] = [];
  if (provenance.content_hash) {
    const actual = crypto.createHash("sha256").update(body).digest("hex");
    if (actual !== provenance.content_hash) failures.push(`content_hash: expected ${provenance.content_hash}, got ${actual}`);
  }
  if (provenance.signature) {
    // REQ-617 — a signature attests a content hash; without one there is
    // nothing to attest, so the block is refused rather than verified over "".
    if (!provenance.content_hash) failures.push("signature: a signature requires a content_hash");
    const key = process.env.TTRPG_ARTIFACT_VERIFY_KEY;
    if (!key) warnings.push("[signature-unverified] module is signed but no verification key is configured");
    else {
      const want = crypto.createHmac("sha256", key).update(provenance.content_hash ?? "").digest("hex");
      if (!hmacMatches(provenance.signature, want)) failures.push("signature: HMAC does not verify");
    }
  }
  return { failures, warnings };
}

export function provenanceSummary(provenance: AdventureProvenance | null | undefined): string {
  if (!provenance) return "";
  const parts: string[] = [];
  if (provenance.creator) parts.push(`creator: ${provenance.creator}`);
  if (provenance.license) parts.push(`license: ${provenance.license}`);
  return parts.length ? ` Provenance — ${parts.join("; ")}.` : "";
}
