#!/usr/bin/env node
/**
 * test-world-remediation.ts — world-model review P6a regression assertions. [gate]
 *
 * Covers the chunk-P6a P0 fixes:
 * - REQ-198/REQ-200 — `manage_world (action: update_thing, fixed)` maps to the
 *   state model's inverse `portable`, so a fixed thing cannot be taken.
 * - REQ-197b — `brief` suppresses the room description, `normal` prints it on
 *   first entry only, `verbose` prints it every time.
 * - REQ-199/REQ-200 — `It is in <container>.` binds the container (not the
 *   room), so converted contents are reachable through the container.
 *
 * Usage: `npx tsx scripts/test-world-remediation.ts`
 * Exit codes: 0 = pass, 1 = one or more assertions failed, 2 = fatal error.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const ROOT = join(import.meta.dirname!, "..");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-world-remediation-"));
process.env.TTRPG_DATA_DIR = DATA_DIR;
process.env.TTRPG_SEED = "1";

const NOVEL = "torre-nosferatu";
const ROOM = "beyond the threshold";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (e: any) {
    failed++;
    console.error(`  FAIL ${name}: ${e?.message ?? e}`);
  }
}
function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}
function textOf(result: any): string {
  return (result?.content ?? []).map((part: any) => part?.text ?? "").join("\n");
}

async function loadEngine(): Promise<any> {
  const { createEngine } = await import(pathToFileURL(join(ROOT, "src", "library.ts")).href);
  return createEngine();
}

async function main(): Promise<void> {
  const engine = await loadEngine();
  await engine.tools.call("manage_novel", { action: "resume", slug: NOVEL });
  await engine.tools.call("set_badge", { badge: "game_master" });

  await test("REQ-199/REQ-200 — container placement binds the container", async () => {
    const { convertSource } = await import(pathToFileURL(join(ROOT, "src", "world", "model.ts")).href);
    const source = [
      'The Vault is a room. "A cold stone vault."',
      'A glass jar is a container. "A jar."',
      "It is in the Vault.",
      'A coin is a thing. "A small coin."',
      "It is in the glass jar.",
    ].join("\n");
    const { world } = convertSource(source, { rooms: new Map(), things: new Map() });
    const coin = world.things.get("a coin");
    assert(coin, "coin was not converted");
    assert(coin.locationType === "container", `expected locationType container, got ${coin.locationType}`);
  });

  await test("REQ-198/REQ-200 — update_thing fixed makes the thing untakeable", async () => {
    await engine.tools.call("manage_scene", { action: "set", description: "Audit room", location: ROOM });
    const created = await engine.tools.call("manage_world", { action: "create_thing", name: "Audit Anvil", kind: "thing", location: ROOM });
    assert(textOf(created).includes("created"), `create failed: ${textOf(created)}`);
    const updated = await engine.tools.call("manage_world", { action: "update_thing", name: "Audit Anvil", fixed: true });
    assert(textOf(updated).includes("updated"), `update failed: ${textOf(updated)}`);
    const got = JSON.parse(textOf(await engine.tools.call("manage_world", { action: "get", id: "audit anvil" })));
    assert(got.portable === false, `expected portable false after fixed:true, got ${got.portable}`);
    const taken = textOf(await engine.tools.call("run_command", { action: "execute", command: "take Audit Anvil" }));
    assert(/RULE_VIOLATION|is fixed/i.test(taken), `take was not refused: ${taken.slice(0, 200)}`);
  });

  await test("REQ-197b — brief/normal/verbose room descriptions", async () => {
    const room = JSON.parse(textOf(await engine.tools.call("manage_world", { action: "get", id: ROOM })));
    const description: string = room.description;
    assert(description && description.length > 0, "starter room has no description to compare against");

    await engine.tools.call("run_command", { action: "execute", command: "brief" });
    const brief = textOf(await engine.tools.call("run_command", { action: "execute", command: "look" }));
    assert(!brief.includes(description), `brief leaked the description: ${brief.slice(0, 200)}`);
    assert(/Exits:/.test(brief), `brief omitted exits: ${brief.slice(0, 200)}`);

    await engine.tools.call("run_command", { action: "execute", command: "verbose" });
    const verbose = textOf(await engine.tools.call("run_command", { action: "execute", command: "look" }));
    assert(verbose.includes(description), `verbose omitted the description: ${verbose.slice(0, 200)}`);

    await engine.tools.call("run_command", { action: "execute", command: "normal" });
    // `normal` prints the full body on a room's first entry only; use a second
    // room because the first was already described above.
    await engine.tools.call("manage_scene", { action: "set", description: "Landing", location: "fifth floor — entry landing" });
    const first = textOf(await engine.tools.call("run_command", { action: "execute", command: "look" }));
    assert(/fifth floor/i.test(first), `normal first entry omitted the room: ${first.slice(0, 200)}`);
    assert(first.length > 200, `normal first entry was compact: ${first.slice(0, 200)}`);
    const second = textOf(await engine.tools.call("run_command", { action: "execute", command: "look" }));
    assert(/^\[OK\] Fifth Floor — Entry Landing\n\nExits:/i.test(second), `normal re-printed the description on a seen room: ${second.slice(0, 200)}`);
  });

  engine.close();
  rmSync(DATA_DIR, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  harnessComplete();
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
