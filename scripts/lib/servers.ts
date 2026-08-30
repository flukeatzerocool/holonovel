// servers.ts — single source of truth for the canonical server list.
//
// Read by TypeScript tooling and by bash entry points (via `node -e`) so the
// server set never drifts across scripts. Keep this file the only place the
// list is declared.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const SERVERS_JSON = join(import.meta.dirname, "servers.json");

export function readServers(): string[] {
  return JSON.parse(readFileSync(SERVERS_JSON, "utf-8")) as string[];
}

export const SERVERS: string[] = readServers();
