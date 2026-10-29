// In-process engine entry. Importing this module is side-effect-free: it loads
// the server module only when createEngine() is called, so the package library
// entry can be imported without creating the data directory, scanning rulesets,
// or setting the autostart guard. createEngine() sets HOLONOVEL_NO_AUTOSTART
// before the dynamic import so the stdio transport does not start.
//
// Constraint: one engine per process. Do not import the library entry and the
// server entry (`holonovel/server`) in the same process — whichever evaluates
// first decides whether the transport starts.

import type { Engine } from "./index.js";

export async function createEngine(): Promise<Engine> {
  process.env.HOLONOVEL_NO_AUTOSTART = "1";
  const mod = await import("./index.js");
  return mod.createEngine();
}

export type { Engine, EngineToolMeta, EngineEventListener } from "./index.js";
