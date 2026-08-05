import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SPEC = path.resolve(__dirname, "..", "..", "holonovel.md");

export function readSpec(specPath?: string): string {
  const target = specPath || DEFAULT_SPEC;
  if (!fs.existsSync(target)) {
    throw new Error(`${target} not found`);
  }
  return fs.readFileSync(target, "utf-8");
}

export function extractReqBodies(text: string): Map<string, { id: string; body: string }> {
  const reqs = new Map<string, { id: string; body: string }>();
  const re = /\*\*(REQ-\d{3}[a-z]?\s+—\s+.+?)\.\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const reqId = match[1].match(/^(REQ-\d{3}[a-z]?)/)![1];
    const bodyStart = match.index + match[0].length;
    const rest = text.slice(bodyStart);
    const endMatch = rest.match(/\*\*REQ-\d{3}[a-z]?\s+—|^#{1,4}\s+/m);
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest;
    reqs.set(reqId, { id: reqId, body });
  }
  return reqs;
}
