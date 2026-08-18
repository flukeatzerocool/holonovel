import { computeFingerprints, type Fingerprints } from "./lib/fingerprints";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const SERVERS = ["holonovel"];

interface FingerprintReport extends Fingerprints {
  server: string;
  timestamp: string;
}

function compute(server: string): FingerprintReport {
  const dir = join(root, server);
  return {
    server,
    ...computeFingerprints(dir),
    timestamp: new Date().toISOString(),
  };
}

const args = process.argv.includes("--json");
const server = process.argv.includes("--server")
  ? process.argv[process.argv.indexOf("--server") + 1]
  : null;

if (server) {
  if (!SERVERS.includes(server)) { console.error(`Unknown server: ${server}`); process.exit(1); }
  const report = compute(server);
  if (args) console.log(JSON.stringify(report, null, 2));
  else {
    for (const [k, v] of Object.entries(report)) console.log(`${k}=${v}`);
  }
} else {
  const results: Record<string, FingerprintReport> = {};
  for (const s of SERVERS) results[s] = compute(s);
  if (args) console.log(JSON.stringify(results, null, 2));
  else {
    for (const [server, report] of Object.entries(results)) {
      console.log(`\n${server}:`);
      for (const [k, v] of Object.entries(report).filter(([k]) => k !== "server")) console.log(`  ${k}=${v}`);
    }
  }
}
