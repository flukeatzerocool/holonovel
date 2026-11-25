#!/usr/bin/env node
/**
 * test-context.ts — context-resolution harness. [gate]
 *
 * Exercises REQ-661/T794: the six precedence rules of `resolveContext`, the
 * unresolved case (a play-scoped novel-capable action with no Novel), the
 * explicit-over-Novel override, the compound `novel+codex` kind, and the
 * descriptor fallback. Exercises REQ-661/T795: the `withContext` carrier —
 * a second content block plus a `context` field, the first block untouched,
 * a second wrap a no-op, a null context a no-op, and an error envelope never
 * wrapped.
 *
 * Pure: imports `src/core/context.ts` and `src/core/context-audit.ts` directly,
 * so no server boots and no state is touched.
 *
 * Usage: tsx scripts/test-context.ts
 * Exit codes: 0 = all checks passed, 1 = a check failed, 2 = fatal.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveContext, withContext, contextLine } from "../src/core/context.js";
import type { ContextRequest } from "../src/core/context.js";
import { descriptorFor } from "../src/core/context-audit.js";
import { bootServer } from "./lib/mcp-client.js";
import { auditFindings } from "./check-context-audit.js";

const SERVER_DIR = join(import.meta.dirname, "..");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): void | Promise<void> {
  if (fn.constructor.name === "AsyncFunction") {
    return (async () => {
      try {
        await fn();
        passed += 1;
        console.log(`  ok  ${name}`);
      } catch (error: any) {
        failed += 1;
        console.log(`  FAIL ${name}\n       ${error?.message ?? error}`);
      }
    })();
  }
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error: any) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error?.message ?? error}`);
  }
}

const base: ContextRequest = { activeNovelSlug: null, scope: "authoring", novelCapable: false };

// ── Rule 1 — explicit ──────────────────────────────────────────────
test("T794/REQ-661: rule 1 — explicit kind wins over an open Novel", () => {
  const ctx = resolveContext({
    explicit: { kind: "codex", id: "character_nemes" },
    activeNovelSlug: "ruined-hour",
    scope: "play",
    novelCapable: true,
  });
  assert.deepEqual(ctx, { kind: "codex", id: "character_nemes", source: "explicit" });
});

test("T794/REQ-661: rule 1 — an explicit id alone resolves as codex", () => {
  const ctx = resolveContext({ ...base, explicit: { id: "lore_ruin" } });
  assert.deepEqual(ctx, { kind: "codex", id: "lore_ruin", source: "explicit" });
});

test("T794/REQ-661: rule 1 — target both yields novel+codex with no id", () => {
  const ctx = resolveContext({ ...base, explicit: { kind: "novel+codex" } });
  assert.deepEqual(ctx, { kind: "novel+codex", id: null, source: "explicit" });
  assert.equal(contextLine(ctx!), "context: novel+codex");
});

// ── Rule 2 — play, and the unresolved case ─────────────────────────
test("T794/REQ-661: rule 2 — a novel-capable play action uses the open Novel", () => {
  const ctx = resolveContext({ ...base, activeNovelSlug: "ruined-hour", scope: "play", novelCapable: true });
  assert.deepEqual(ctx, { kind: "novel", id: "ruined-hour", source: "play" });
});

test("T794/REQ-661: rule 2 — a novel-capable authoring action stays in the Novel", () => {
  const ctx = resolveContext({ ...base, activeNovelSlug: "ruined-hour", scope: "authoring", novelCapable: true });
  assert.deepEqual(ctx, { kind: "novel", id: "ruined-hour", source: "play" });
});

test("T794/REQ-661: rule 2 — a play action with no Novel is unresolved", () => {
  assert.equal(resolveContext({ ...base, scope: "play", novelCapable: true }), null);
});

// ── Rule 3 — subject ───────────────────────────────────────────────
test("T794/REQ-661: rule 3 — subject scope resolves to the roster", () => {
  const ctx = resolveContext({ ...base, scope: "subject", novelCapable: true });
  assert.deepEqual(ctx, { kind: "roster", id: null, source: "subject" });
});

test("T794/REQ-661: rule 3 — a named roster subject carries its id", () => {
  const ctx = resolveContext({ ...base, scope: "subject", novelCapable: false, subjectKind: "roster", subjectId: "character_01" });
  assert.deepEqual(ctx, { kind: "roster", id: "character_01", source: "subject" });
});

test("T794/REQ-661: rule 3 — a PC create with no Novel resolves to the roster", () => {
  // The create row is scope: subject, novelCapable: true.
  const ctx = resolveContext({ ...base, scope: "subject", novelCapable: true });
  assert.equal(ctx?.kind, "roster");
});

// ── Rules 4–6 ──────────────────────────────────────────────────────
test("T794/REQ-661: rule 4 — authoring with no Novel is codex", () => {
  assert.deepEqual(resolveContext({ ...base, scope: "authoring", novelCapable: true }), {
    kind: "codex",
    id: null,
    source: "authoring",
  });
});

test("T794/REQ-661: rule 5 — a ruleset lookup is reference", () => {
  assert.deepEqual(resolveContext({ ...base, scope: "lookup", novelCapable: false }), {
    kind: "reference",
    id: null,
    source: "lookup",
  });
});

test("T794/REQ-661: rule 6 — fallback is codex, never novel", () => {
  const ctx = resolveContext({ ...base, activeNovelSlug: "ruined-hour", scope: "play", novelCapable: false });
  assert.deepEqual(ctx, { kind: "codex", id: null, source: "fallback" });
});

// ── Descriptors ────────────────────────────────────────────────────
test("T794/REQ-661: descriptorFor — an absent row is authoring and unwrapped", () => {
  assert.deepEqual(descriptorFor("manage_nothing", "do"), { scope: "authoring", novelCapable: false, wrapped: false });
});

// ── T795 — the response carrier ────────────────────────────────────
const ctxCodex = { kind: "codex" as const, id: "c1", source: "authoring" as const };

test("T795/REQ-661: carrier — appends a second block and sets the field", () => {
  const result = withContext(
    { content: [{ type: "text" as const, text: "body" }], structuredContent: { status: "OK", text: "body" } },
    ctxCodex,
  );
  assert.equal(result.content.length, 2);
  assert.equal(result.content[0].text, "body");
  assert.equal(result.content[1].text, "context: codex (c1)");
  assert.deepEqual(result.structuredContent?.context, { kind: "codex", id: "c1", source: "authoring" });
  assert.equal(result.structuredContent?.text, "body");
});

test("T795/REQ-661: carrier — a JSON body stays byte-verbatim with textBlock false", () => {
  const result = withContext(
    { content: [{ type: "text" as const, text: '{"a":1}' }], structuredContent: { status: "OK", text: '{"a":1}' } },
    ctxCodex,
    { textBlock: false },
  );
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].text, '{"a":1}');
  assert.deepEqual(result.structuredContent?.context, { kind: "codex", id: "c1", source: "authoring" });
});

test("T795/REQ-661: carrier — a second wrap is a no-op", () => {
  const once = withContext({ content: [{ type: "text" as const, text: "body" }], structuredContent: {} }, ctxCodex);
  const twice = withContext(once, { kind: "novel", id: "n", source: "play" });
  assert.equal(twice.content.length, 2);
  assert.equal(twice.structuredContent?.context.kind, "codex");
});

test("T795/REQ-661: carrier — a null context is a no-op", () => {
  const result = withContext({ content: [{ type: "text" as const, text: "body" }], structuredContent: {} }, null);
  assert.equal(result.content.length, 1);
  assert.equal(result.structuredContent?.context, undefined);
});

test("T795/REQ-661: carrier — an error envelope is never wrapped", () => {
  const result = withContext(
    { content: [{ type: "text" as const, text: "[ERROR] [STATE_CONFLICT] x" }], structuredContent: { status: "ERROR" }, isError: true as const },
    ctxCodex,
  );
  assert.equal(result.content.length, 1);
  assert.equal(result.structuredContent?.context, undefined);
});

test("T795/REQ-661: carrier — no id prints no parenthetical", () => {
  assert.equal(contextLine({ kind: "codex", id: null, source: "authoring" }), "context: codex");
});


test("T798/REQ-661: auditFindings — a missing row is unclassified, a stale row is reported", () => {
  const observed = [{ key: "manage_lore.set", count: 1 }];
  const complete = [{ tool: "manage_lore", action: "set", class: "wrongly-novel-bound" as const, scope: "play" as const, novelCapable: true, wrapped: false, sites: 1, disposition: "A4" as const }];
  assert.deepEqual(auditFindings(observed, complete), []);
  assert.match(auditFindings(observed, []).join("\n"), /unclassified call site/);
  const stale = [{ ...complete[0], sites: 2 }];
  assert.match(auditFindings(observed, stale).join("\n"), /row says 2 site\(s\), code has 1/);
});

// ── Live proofs: no Novel active (T796, T797, and the T794 probes) ──
async function main(): Promise<void> {
  const dataDir = mkdtempSync(join(tmpdir(), "holonovel-context-"));
  const env = { TTRPG_STARTER_NOVEL: "off" };
  let client = await bootServer({ serverDir: SERVER_DIR, dataDir, env });
  try {
    await test("T796/REQ-088e: character creation with no Novel writes a roster entry and reports context: roster", async () => {
      const char = await client.call("manage_character", {
        action: "create",
        name: "Nemes",
        species: "human",
        description: "A rival duelist with a long memory.",
      });
      assert.equal(char.isError, false, char.text.slice(0, 300));
      assert.match(char.text, /context: roster/, "create with no Novel must report the roster");
      assert.match(char.text, /character_\d+/, "create must name the roster id");
    });

    await test("T797/REQ-075a: NPC creation with no Novel writes a codex entry of kind npc", async () => {
      const npc = await client.call("manage_npc", { action: "create", name: "The Caretaker", disposition: "neutral" });
      assert.equal(npc.isError, false, npc.text.slice(0, 300));
      assert.match(npc.text, /context: codex/, "NPC create with no Novel must report the codex");
      const get = await client.call("manage_codex", { action: "get", id: "npc_the_caretaker" });
      assert.equal(get.isError, false, get.text.slice(0, 300));
      assert.match(get.text, /"kind":\s*"npc"/, "the entry must be stored as kind npc");
    });

    await test("T794/REQ-661: codex, ruleset, and adventure report the store they used with no Novel", async () => {
      const list = await client.call("manage_codex", { action: "list", kind: "npc" });
      assert.equal(list.isError, false, list.text.slice(0, 300));
      assert.equal((list.raw as any).result.structuredContent.context.kind, "codex", "codex list must report the codex");
      assert.doesNotThrow(() => JSON.parse(list.text), "the codex list body must stay parseable");
      const exported = await client.call("manage_codex", { action: "export" });
      assert.equal(exported.isError, false, exported.text.slice(0, 300));
      assert.equal((exported.raw as any).result.structuredContent.context.kind, "codex");
      assert.match(exported.text, /holonovel\.codex\/1/);
      const search = await client.call("manage_ruleset", { action: "search", query: "sword", slug: "nonexistent" });
      assert.equal(search.isError, false, search.text.slice(0, 300));
      assert.equal((search.raw as any).result.structuredContent.context.kind, "reference", "a ruleset lookup must report the reference store");
      const adventure = await client.call("manage_adventure", {
        action: "generate",
        premise: "The goblin king demands tribute",
        target: "codex",
      });
      assert.equal(adventure.isError, false, adventure.text.slice(0, 300));
      assert.match(adventure.text, /context: codex/);
    });

    await test("T794/REQ-661: a Novel-only action refuses and an explicit novel context is not redirected", async () => {
      const refusal = await client.call("manage_scene", { action: "set", description: "x" });
      assert.equal(refusal.isError, true, "a Novel-only action must still refuse with no Novel");
      assert.match(refusal.text, /STATE_CONFLICT/);
      assert.match(refusal.text, /Corrective action/);
      const explicitNovel = await client.call("manage_character", { action: "create", name: "Should Refuse", context: "novel" });
      assert.equal(explicitNovel.isError, true, "an explicit novel context with no Novel must refuse");
      assert.match(explicitNovel.text, /STATE_CONFLICT/);
    });

    await client.close();
    client = undefined as any;

    await test("T796/REQ-088e: a roster entry created with no Novel survives a restart", async () => {
      const rosterFile = join(dataDir, "roster.json");
      assert.ok(existsSync(rosterFile), "roster.json must exist after a no-Novel create");
      const first = JSON.parse(readFileSync(rosterFile, "utf-8"));
      const entry: any = Object.values(first).find((v: any) => v && typeof v === "object" && "name" in v && v.name === "Nemes");
      assert.ok(entry, "the roster entry must be persisted");
      assert.ok(entry.created_at, "created_at must be persisted");
      assert.ok("identity" in entry, "identity must be persisted");
      const again = await bootServer({ serverDir: SERVER_DIR, dataDir, env });
      try {
        const listed = await again.call("manage_character", { action: "roster_list" });
        assert.equal(listed.isError, false, listed.text.slice(0, 300));
        assert.match(listed.text, /Nemes/, "the roster entry must survive a restart");
        assert.equal((listed.raw as any).result.structuredContent.context.kind, "roster");
      } finally {
        await again.close();
      }
    });
  } finally {
    if (client) await client.close();
    rmSync(dataDir, { recursive: true, force: true });
  }

  console.log(`\n${passed + failed} cases — ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
