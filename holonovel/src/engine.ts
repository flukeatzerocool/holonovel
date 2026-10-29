// In-process engine entry. Importing this module loads the engine without
// starting the stdio transport: the autostart guard in `index.ts` reads
// HOLONOVEL_NO_AUTOSTART, set here before the dynamic import is evaluated.
//
// Constraint: one engine per process. Do not import the library entry and the
// server entry (`holonovel/server`) in the same process — whichever evaluates
// first decides whether the transport starts.

process.env.HOLONOVEL_NO_AUTOSTART = "1";
const mod = await import("./index.js");

export const createEngine = mod.createEngine;
export type { Engine, EngineToolMeta, EngineEventListener } from "./index.js";
