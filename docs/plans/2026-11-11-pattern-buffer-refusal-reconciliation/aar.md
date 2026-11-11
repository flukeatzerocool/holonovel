# After-action report — §5.10 parser unknown-verb refusal reconciliation

Increment: `docs/plans/2026-11-11-pattern-buffer-refusal-reconciliation/`
Plan: `plan.md` · sha256 02e3782e…
Cold pass: `plan.cold/report.md` · sha256 9968c614… · stages 5/5
Tree at start: c424a87 (clean, increment directory untracked)

## Objective and outcome

Roadmap P1 "Pattern-buffer I1 verb-refusal expectation" closed by deciding
that REQ-196c/REQ-196d own the unknown-verb refusal text and aligning the two
stale surfaces. No production behaviour changed.

## Baseline (Phase 0)

| Command | Result |
|---|---|
| `npm run status` | 15 open roadmap items, 49 unpushed, version 2026.11.11 |
| `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |
| `test:pattern-buffer` | 17/18, I1 failed |
| `test:pattern-buffer-ruleset` | PASS, 27/27 (8 skipped, 2 stubbed) |
| `test:all` | 50 passed, 6 failed — all holosuite `predicate_unresolved` anchors (pre-existing, ROADMAP P2) |

Stale-site grep confirmed two sites only: `spec/appendices-fixtures.md:865`
and `holonovel/scripts/run_pattern_buffer.ts:243`. Register scan confirmed no
`Scheduled-roadmap` row matched the roadmap section and F-P6a-19 was free.

## Capture (Phase 1)

`/tmp/pb-w3-probe.ts` (throwaway, body reproduced below): creates
`probe-w3`, converts the W.1 fixture, creates and activates `ProbeHero`, sets
`player`, calls `run_command { command: "xyzzy" }`.

```ts
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = "/home/fluke/Holonovel";
const SERVER = join(ROOT, "holonovel/src/index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-w3-probe-"));
const spec = readFileSync(join(ROOT, "spec/appendices-fixtures.md"), "utf8").split("\n");
const FIXTURE = spec.slice(788, 807).join("\n");

let msgId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";

function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

async function boot(): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER], {
    cwd: ROOT,
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR },
    stdio: ["pipe", "pipe", "pipe"],
  });
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)!(msg);
          pending.delete(msg.id);
        }
      } catch { /* non-JSON */ }
    }
  });
  proc.stderr!.on("data", () => { /* boot diagnostics only */ });
  await send(proc, {
    method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "w3-probe", version: "1.0.0" } },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(300);
  return proc;
}

async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}

async function main(): Promise<void> {
  const proc = await boot();
  try {
    await call(proc, "manage_novel", { action: "create", name: "probe-w3" });
    await call(proc, "manage_world", { action: "convert", source: FIXTURE });
    await call(proc, "manage_character", { action: "create", name: "ProbeHero" });
    await call(proc, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(proc, "set_badge", { badge: "player" });
    console.log(JSON.stringify(await call(proc, "run_command", { command: "xyzzy" })));
  } finally {
    proc.kill();
  }
}
main();
```

Captured output:

```
[ERROR] [UNIMPLEMENTED] Unknown verb 'xyzzy'. Valid commands include: ask, climb, close.
Corrective action: Use one of: ask, climb, close.
```

The `convert` step also printed three "Unrecognized assertion pattern" notices
and one door-location notice for the W.1 text; they do not affect the refusal
path and were present before this increment.

## Step-to-evidence

| Step | Files | Command | Result |
|---|---|---|---|
| Baseline | — | `check:fast`, `test:pattern-buffer`, `test:pattern-buffer-ruleset`, `test:all` | as above |
| Capture | `/tmp/pb-w3-probe.ts` | `npx tsx /tmp/pb-w3-probe.ts` | captured text above |
| Transcript | `spec/appendices-fixtures.md` | scoped greps (`sed -n '860,880p'`) | 1 / 1 / 0 |
| Harness | `holonovel/scripts/run_pattern_buffer.ts` | `npm --prefix holonovel run test:pattern-buffer` | 18/18 |
| Roadmap | `ROADMAP.md` | `npm run check-roadmap` | see Phase 4 |
| Register | `spec/audit/review-register.md` | `npm run check-registers` | see Phase 4 |
| Changelog | `CHANGELOG.md` | `npm run check:fast` | see Phase 4 |

## Phase 4 results

| Check | Result |
|---|---|
| `test:pattern-buffer` | 18/18, exit 0 |
| `test:backfill` | 104 passed, 0 failed |
| `test:world-provider` | 7 passed, 0 failed |
| `npm run assemble` | wrote `holonovel.md`, `holonovel/holonovel.md`; phase-map hash updated |
| `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |
| `npm run validate -- --sdd-strict` | 0 errors, 285 warnings |
| `npm run check-roadmap` | OK (16 sections) |
| `npm run check-registers` | PASS |
| `npm run check-loop-artifacts` | PASS |
| scoped block greps | 1 / 1 / 0 |

## Deviations

- The transcript response is wrapped across two physical lines to keep the
  file's ~80-column style; the server emits it on one line. The transcript is
  illustrative and the plan authorised wrapping.
- The plan expected Phase 0's `test:all` to name six failing suites; it
  reported 50 passed / 6 failed, all holosuite anchor findings. Recorded, not
  claimed green.

## Findings and dispositions

- **P0 — none.**
- **P1 — REQ-196a Player-badge clause** (discovered during plan review):
  `Scheduled-roadmap` as F-P6a-19 with a ROADMAP section.
- **P2/P3 — none new.**

## Deployment

`deployed: not applicable — no publication in scope`.

Commit: this increment's single commit — `2026-11-11 — §5.10 parser
unknown-verb refusal reconciliation` (hash not recorded: the AAR ships inside
the commit it describes).

## Loop status

LOOP PAUSED
