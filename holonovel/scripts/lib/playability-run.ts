// playability-run.ts — engine child driver for the playability gate.
//
// Loads one Novel fixture into an isolated data directory, drives the derived
// script through createEngine(), and reports the run as one JSON verdict on
// stdout. Runs in a child process so each Novel gets a fresh in-process engine
// and data directory (one engine per process). The parent gate owns pass/fail.
//
// REQ citations: REQ-565 (starter Novel), REQ-200 (world-model reachability),
// REQ-073c2 / REQ-329a (countdown direction and trigger deltas).
// Exit codes: 0 = run completed, 1 = engine/tool failure, 2 = fatal.

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import type { DerivedScript, ScriptStep } from "./playability-model.js";

interface StepResult {
  tag: string;
  tool: string;
  ok: boolean;
  text: string;
}

interface Verdict {
  novel: string;
  slug: string;
  reached: boolean;
  finalRoom: string | null;
  goalRooms: string[];
  findings: { class: string; detail: string }[];
  observations: Record<string, unknown>;
  steps: StepResult[];
}

function parseArgs(argv: string[]): { novel: string; script: string; seed: number } {
  const value = (name: string): string | null => {
    const index = argv.indexOf(name);
    return index === -1 ? null : (argv[index + 1] ?? null);
  };
  const novel = value("--novel");
  const script = value("--script");
  const seed = Number(value("--seed") ?? "1");
  if (!novel || !script) {
    process.stderr.write("playability-run: --novel and --script are required\n");
    process.exit(2);
  }
  return { novel, script, seed };
}

function textOf(result: unknown): string {
  const parts = (result as { content?: { text?: string }[] })?.content ?? [];
  return parts.map((part) => part?.text ?? "").join("\n");
}

function isFailure(result: unknown, tool = ""): boolean {
  if ((result as { isError?: boolean })?.isError === true) return true;
  const text = textOf(result);
  if (text.startsWith("[ERROR]") || text.includes("[ERROR] [")) return true;
  return tool === "run_command" && text.startsWith("[WARNING]");
}

function firstLineAfterOk(text: string): string | null {
  const match = text.match(/^\[OK\](?:\s*\[[A-Z_]+\])?\s*(.+)$/m);
  if (!match) return null;
  return match[1].trim();
}

async function main(): Promise<void> {
  const { novel: novelPath, script: scriptPath, seed } = parseArgs(process.argv.slice(2));
  const novel = JSON.parse(readFileSync(novelPath, "utf-8")) as Record<string, unknown>;
  const script = JSON.parse(readFileSync(scriptPath, "utf-8")) as DerivedScript;

  const dataDir = mkdtempSync(join(tmpdir(), "holonovel-playability-"));
  process.env.TTRPG_DATA_DIR = dataDir;
  process.env.TTRPG_SEED = String(seed);

  const { createEngine } = (await import(pathToFileURL(join(import.meta.dirname, "..", "..", "src", "library.ts")).href)) as {
    createEngine: () => {
      tools: { call: (name: string, args?: Record<string, unknown>) => Promise<unknown> };
      close: () => void;
    };
  };

  const engine = createEngine();
  const steps: StepResult[] = [];
  const findings: { class: string; detail: string }[] = [];
  let fatal = false;

  const call = async (name: string, args: Record<string, unknown>, tag: string): Promise<unknown> => {
    try {
      const result = await engine.tools.call(name, args);
      steps.push({ tag, tool: name, ok: !isFailure(result, name), text: textOf(result).slice(0, 400) });
      return result;
    } catch (error) {
      steps.push({ tag, tool: name, ok: false, text: String((error as Error)?.message ?? error).slice(0, 400) });
      return { isError: true, content: [{ type: "text", text: String((error as Error)?.message ?? error) }] };
    }
  };

  let finalRoom: string | null = null;
  let countdownList: unknown = null;

  try {
    const created = await call("manage_novel", { action: "create", name: `Playability Scaffold ${process.pid}` }, "novel_create");
    if (isFailure(created)) throw new Error(`novel create failed: ${textOf(created)}`);
    const badge = await call("set_badge", { badge: "game_master" }, "set_badge");
    if (isFailure(badge)) throw new Error(`badge failed: ${textOf(badge)}`);
    let imported = await call(
      "manage_archive",
      { action: "import", mode: "replace", strict: true, data: JSON.stringify(novel) },
      "novel_import",
    );
    if (isFailure(imported)) {
      // The shipped artifact carries title-case exit targets while import
      // resolves references against lowercase room keys; retry non-strict so
      // the gate reads the packaged form without rewriting content.
      imported = await call(
        "manage_archive",
        { action: "import", mode: "replace", data: JSON.stringify(novel) },
        "novel_import_nonstrict",
      );
    }
    if (isFailure(imported)) throw new Error(`fixture import failed: ${textOf(imported)}`);

    for (const step of script.steps as ScriptStep[]) {
      const tag = step.tag ?? `${step.tool}`;
      const result = await call(step.tool, step.args as Record<string, unknown>, tag);
      if (tag === "final_look") finalRoom = firstLineAfterOk(textOf(result));
      if (tag === "countdown_list") countdownList = textOf(result);
      if (tag.startsWith("encounter_init:") && isFailure(result)) {
        findings.push({ class: "encounter_unsurvivable", detail: `encounter init failed at ${tag.split(":")[1]}: ${textOf(result).slice(0, 200)}` });
      }
    }
  } catch (error) {
    fatal = true;
    findings.push({ class: "run_failed", detail: String((error as Error)?.message ?? error) });
  } finally {
    engine.close();
    rmSync(dataDir, { recursive: true, force: true });
  }

  const goalRooms = script.goalRooms.map((room) => room.toLowerCase());
  const reached = finalRoom !== null && goalRooms.includes(finalRoom.toLowerCase());
  let fired: string[] = [];
  if (typeof countdownList === "string") {
    try {
      const parsed = JSON.parse(countdownList) as { name: string }[];
      fired = parsed.map((entry) => entry.name);
    } catch {
      // A non-JSON countdown list leaves fired empty; the gate reports the gap.
    }
  }

  const verdict: Verdict = {
    novel: String(novel.name ?? ""),
    slug: String(novel.slug ?? ""),
    reached,
    finalRoom,
    goalRooms,
    findings,
    observations: {
      final_room: finalRoom,
      countdowns_remaining: fired,
      steps: steps.length,
    },
    steps,
  };
  process.stdout.write(`${JSON.stringify(verdict)}\n`);
  process.exit(fatal ? 1 : 0);
}

main().catch((error) => {
  process.stderr.write(`playability-run: ${String((error as Error)?.stack ?? error)}\n`);
  process.exit(2);
});
