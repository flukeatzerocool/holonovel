import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const SERVERS = ["dnd5e-holonovel", "holonovel"];

const serverArg = process.argv.includes("--server")
  ? process.argv[process.argv.indexOf("--server") + 1]
  : null;

function parseTraceabilityTable(md: string): { req: string; title: string; location: string }[] {
  const rows: { req: string; title: string; location: string }[] = [];
  const lines = md.split("\n");
  let inTable = false;
  for (const line of lines) {
    if (line.match(/^\| REQ-\d/)) {
      inTable = true;
      const cols = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cols.length >= 3) rows.push({ req: cols[0], title: cols[1], location: cols[2] });
    } else if (inTable && !line.startsWith("|")) {
      inTable = false;
    }
  }
  return rows;
}

function extractBacktickSymbols(location: string): string[] {
  const matches = location.matchAll(/`([^`]+)`/g);
  return Array.from(matches).map(m => m[1]).filter(s => !s.includes("/") && !s.endsWith(".ts") && !s.endsWith(".json"));
}

function symbolExistsInIndex(serverDir: string, symbol: string): { exists: boolean; kind: string; line?: number } {
  const indexPath = join(serverDir, "src", "index.ts");
  if (!existsSync(indexPath)) return { exists: false, kind: "unknown" };

  const src = readFileSync(indexPath, "utf-8");
  const lines = src.split("\n");

  const toolRe = new RegExp(`registerTool\\((${escapeRegex(JSON.stringify(symbol))})`);
  const resourceRe = new RegExp(`registerResource\\((${escapeRegex(JSON.stringify(symbol))})`);
  const resourceTemplateRe = new RegExp(`registerResource\\((${escapeRegex(JSON.stringify(symbol))}),\\s*new ResourceTemplate`);

  for (let i = 0; i < lines.length; i++) {
    if (toolRe.test(lines[i])) return { exists: true, kind: "tool", line: i + 1 };
    if (resourceRe.test(lines[i])) return { exists: true, kind: "resource", line: i + 1 };
  }

  const genSymbols: Record<string, RegExp> = {
    create_character: /registerTool\(["']create_character["']/,
    session_recap: /registerTool\(["']session_recap["']/,
    character_sheet: /registerTool\(["']character_sheet["']/,
    generate_adventure: /registerTool\(["']generate_adventure["']/,
    generate_encounter: /registerTool\(["']generate_encounter["']/,
    compact_audit_log: /registerTool\(["']compress_audit["']/,
    rename_novel: /registerTool\(["']rename_novel["']/,
  };

  if (genSymbols[symbol]) {
    for (let i = 0; i < lines.length; i++) {
      if (genSymbols[symbol].test(lines[i])) return { exists: true, kind: "tool", line: i + 1 };
    }
  }

  const uriRe = new RegExp(`ResourceTemplate\\((${escapeRegex(JSON.stringify(symbol))})`);
  const plainResRe = new RegExp(`registerResource\\((${escapeRegex(JSON.stringify(symbol))}[:-])`);
  for (let i = 0; i < lines.length; i++) {
    if (uriRe.test(lines[i]) || plainResRe.test(lines[i])) return { exists: true, kind: "resource", line: i + 1 };
  }

  return { exists: false, kind: "unknown" };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
}

function collectToolNames(serverDir: string): Set<string> {
  const indexPath = join(serverDir, "src", "index.ts");
  if (!existsSync(indexPath)) return new Set();
  const src = readFileSync(indexPath, "utf-8");
  const names = new Set<string>();
  const matches = src.matchAll(/registerTool\(["']([a-z0-9_]+)["']/g);
  for (const m of matches) names.add(m[1]);
  return names;
}

function collectResourceURIs(serverDir: string): Set<string> {
  const indexPath = join(serverDir, "src", "index.ts");
  if (!existsSync(indexPath)) return new Set();
  const src = readFileSync(indexPath, "utf-8");
  const uris = new Set<string>();
  for (const m of src.matchAll(/registerResource\(["']([a-z0-9_:\-/{}]+)["']/g)) uris.add(m[1]);
  for (const m of src.matchAll(/new ResourceTemplate\(["']([a-z0-9_:\-/{}]+)["']/g)) uris.add(m[1]);
  return uris;
}

function checkServer(server: string): { warnings: string[]; deferredCount: number; checkedCount: number } {
  const serverDir = join(root, server);
  const decisionsPath = join(serverDir, "DECISIONS.md");
  if (!existsSync(decisionsPath)) {
    console.log(`  ${server}: DECISIONS.md not found — skipping`);
    return { warnings: [], deferredCount: 0, checkedCount: 0 };
  }

  const md = readFileSync(decisionsPath, "utf-8");
  const rows = parseTraceabilityTable(md);
  const deferredRows = rows.filter(r => r.location.startsWith("Deferred") || r.location.startsWith("Waived"));

  console.log(`  ${server}: ${rows.length} traceability rows, ${deferredRows.length} Deferred/Waived`);

  const toolNames = collectToolNames(serverDir);
  const resourceURIs = collectResourceURIs(serverDir);
  const warnings: string[] = [];
  let checked = 0;

  for (const row of deferredRows) {
    const symbols = extractBacktickSymbols(row.location);
    if (symbols.length === 0) continue;

    checked++;
    for (const sym of symbols) {
      if (sym.length < 3) continue;

      if (toolNames.has(sym)) {
        warnings.push(`${server} ${row.req}: Deferred but tool \`${sym}\` already registered in src/index.ts — verify entry still describes what's missing`);
      } else if (resourceURIs.has(sym)) {
        warnings.push(`${server} ${row.req}: Deferred but resource \`${sym}\` already registered in src/index.ts — verify entry still describes what's missing`);
      } else {
        const check = symbolExistsInIndex(serverDir, sym);
        if (check.exists) {
          warnings.push(`${server} ${row.req}: Deferred but ${check.kind} \`${sym}\` found at src/index.ts:${check.line} — verify entry still describes what's missing`);
        }
      }
    }
  }

  return { warnings, deferredCount: deferredRows.length, checkedCount: checked };
}

const targets = serverArg ? [serverArg] : SERVERS;
let totalWarnings = 0;

for (const server of targets) {
  const result = checkServer(server);
  totalWarnings += result.warnings.length;
  for (const w of result.warnings) console.log(`  WARNING: ${w}`);
}

if (totalWarnings > 0) {
  console.log(`\n${totalWarnings} stale Deferred/Waived entries found — code exists but traceability says deferred.`);
  console.log("These may be partial implementations. Review and either mark as Implemented or update the deferred reason.");
} else {
  console.log("\nNo stale traceability entries found.");
}
process.exit(0);
