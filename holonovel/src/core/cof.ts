// COF — Character Open File reader. One-way import only: a local `.cof`
// container is read into an NPC plus subjective-memory records. No export path
// and no runtime dependency on the format.
// REQ-075j.

import { inflateRawSync } from "node:zlib";

export interface CofMemory {
  gist: string;
  felt_then: string;
  salience: number;
  origin: "witnessed" | "told" | "inferred" | "authored";
  disclosure: "open" | "guarded" | "secret";
}

export interface CofCharacter {
  name: string;
  description: string;
  persona: string;
  memories: CofMemory[];
  unsupported: string[];
}

const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;
const MAX_ENTRY_BYTES = 1024 * 1024;
const MAX_TOTAL_BYTES = 16 * 1024 * 1024;
const MAX_ENTRIES = 500;
const MAX_RATIO = 200;

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

function fail(message: string): never {
  throw new Error(message);
}

function safePath(name: string): boolean {
  if (name.length === 0 || name.startsWith("/") || name.includes("\\")) return false;
  if (!/^[A-Za-z0-9._/-]+$/.test(name)) return false;
  return !name.split("/").some((part) => part === ".." || part === "");
}

export function readCofArchive(bytes: Buffer): Map<string, Buffer> {
  if (bytes.length > MAX_ARCHIVE_BYTES) fail("archive exceeds the 8 MB cap");
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === EOCD) { eocd = i; break; }
  }
  if (eocd < 0) fail("not a ZIP container (no end-of-central-directory record)");
  const count = bytes.readUInt16LE(eocd + 10);
  const dirOffset = bytes.readUInt32LE(eocd + 16);
  if (count > MAX_ENTRIES) fail(`archive has more than ${MAX_ENTRIES} entries`);
  const files = new Map<string, Buffer>();
  let total = 0;
  let p = dirOffset;
  for (let n = 0; n < count; n++) {
    if (bytes.readUInt32LE(p) !== CENTRAL) fail("malformed central directory");
    const method = bytes.readUInt16LE(p + 10);
    const compressed = bytes.readUInt32LE(p + 20);
    const uncompressed = bytes.readUInt32LE(p + 24);
    const nameLen = bytes.readUInt16LE(p + 28);
    const extraLen = bytes.readUInt16LE(p + 30);
    const commentLen = bytes.readUInt16LE(p + 32);
    const localOffset = bytes.readUInt32LE(p + 42);
    const name = bytes.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    p += 46 + nameLen + extraLen + commentLen;
    if (!safePath(name)) fail(`unsafe entry path: ${name}`);
    if (uncompressed > MAX_ENTRY_BYTES) fail(`entry exceeds the 1 MB cap: ${name}`);
    if (compressed > 0 && uncompressed / compressed > MAX_RATIO) fail(`entry compression ratio exceeds ${MAX_RATIO}:1: ${name}`);
    if (bytes.readUInt32LE(localOffset) !== LOCAL) fail(`malformed local header: ${name}`);
    const localNameLen = bytes.readUInt16LE(localOffset + 26);
    const localExtraLen = bytes.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const raw = bytes.subarray(start, start + compressed);
    let data: Buffer;
    if (method === 0) data = Buffer.from(raw);
    else if (method === 8) data = inflateRawSync(raw);
    else fail(`unsupported compression method ${method}: ${name}`);
    if (data.length > MAX_ENTRY_BYTES) fail(`entry exceeds the 1 MB cap after decompression: ${name}`);
    total += data.length;
    if (total > MAX_TOTAL_BYTES) fail("archive exceeds the 16 MB decompressed cap");
    files.set(name, data);
  }
  return files;
}

function textOf(value: any): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const first = Object.values(value).find((v) => typeof v === "string");
    if (typeof first === "string") return first;
  }
  return "";
}

function emotionOf(value: any): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return textOf(value.label) || String(value.category ?? "") || textOf(value.emotion);
}

function originOf(node: any): CofMemory["origin"] {
  const nature = Array.isArray(node?.nature) ? node.nature : [];
  if (nature.includes("learned")) return "told";
  if (nature.includes("imagined")) return "inferred";
  if (nature.includes("witnessed") || nature.includes("experienced")) return "witnessed";
  return node?.origin === "lived" ? "witnessed" : "authored";
}

function disclosureOf(node: any): CofMemory["disclosure"] {
  return node?.disclosure === "open" || node?.disclosure === "guarded" || node?.disclosure === "secret"
    ? node.disclosure
    : "secret";
}

export function parseCof(bytes: Buffer): CofCharacter {
  const files = readCofArchive(bytes);
  const mimetype = files.get("mimetype")?.toString("utf8").trim();
  if (mimetype !== "application/vnd.cof.character+zip") fail("missing COF mimetype entry");
  const manifestRaw = files.get("manifest.json");
  if (!manifestRaw) fail("missing manifest.json");
  let manifest: any;
  try { manifest = JSON.parse(manifestRaw.toString("utf8")); }
  catch { fail("manifest.json is not valid JSON"); }
  if (typeof manifest?.cof !== "string" || !/^1\.[0-9]+$/.test(manifest.cof)) fail("unsupported COF version");
  if (typeof manifest?.name !== "string" || !manifest.name.trim()) fail("manifest.name is required");

  const unsupported: string[] = [];
  let description = "";
  let persona = "";
  const personality = manifest?.elements?.personality?.variants ?? {};
  for (const variant of Object.values<any>(personality)) {
    if (typeof variant?.card === "string") {
      const raw = files.get(variant.card);
      if (raw) {
        try {
          const card = JSON.parse(raw.toString("utf8"));
          const data = card?.data ?? card;
          description ||= typeof data?.description === "string" ? data.description : "";
          persona ||= typeof data?.personality === "string" ? data.personality : "";
        } catch { unsupported.push(`personality card ${variant.card}`); }
      }
    }
    if (variant?.psyche !== undefined) unsupported.push("psyche");
  }

  const memories: CofMemory[] = [];
  const memoryCat = manifest?.elements?.memories?.variants ?? {};
  for (const [variantId, variant] of Object.entries<any>(memoryCat)) {
    const path = variant?.memory;
    if (typeof path !== "string") continue;
    const raw = files.get(path);
    if (!raw) { unsupported.push(`memory ${variantId}`); continue; }
    try {
      const node = JSON.parse(raw.toString("utf8"));
      const gist = textOf(node?.gist).trim();
      if (!gist) { unsupported.push(`memory ${variantId} (no gist)`); continue; }
      const salience = typeof node?.salience === "number" ? Math.min(100, Math.max(0, node.salience)) / 100 : 0.5;
      memories.push({
        gist,
        felt_then: emotionOf(node?.felt_then),
        salience,
        origin: originOf(node),
        disclosure: disclosureOf(node),
      });
    } catch { unsupported.push(`memory ${variantId} (invalid JSON)`); }
  }
  if (Array.isArray(manifest?.elements?.files?.variants) || manifest?.elements?.files) unsupported.push("files");

  return { name: manifest.name.trim(), description, persona, memories, unsupported };
}
