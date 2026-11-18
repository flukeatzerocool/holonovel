// World-generation types — the annotation surface shared by the generation
// helpers in `index.ts` and the `manage_world (action: generate)` path in
// `tools/world-crud.ts`. Moved verbatim from `index.ts` during stage 2 of its
// split, so neither side has to import the other. This module imports nothing,
// which is what keeps the type dependency acyclic.

export type WorldGenRole = "room" | "objects" | "persons" | "hazards" | "secrets";

export interface GeneratedSecret {
  key: string;
  content: string;
  triggers: string[];
  badge_scope: "game_master" | "shared";
  world_target: string;
  clue: string;
  container: string;
}

export interface GeneratedWitness {
  name: string;
  room: string;
}

export interface WorldGenTable {
  key: string;
  title: string;
  dice_expression: string;
  ranges: { min: number; max: number; result: unknown }[];
}

export interface WorldGenRoll {
  table: string;
  die: string;
  range: string;
  result: string;
}
