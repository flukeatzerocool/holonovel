// Deterministic seeded PRNG (REQ-050).
//
// Reference randomizer contract (Appendix B.4):
//   32-bit linear congruential generator
//   state <- (state * 1664525 + 1013904223) mod 2^32
//   initial state = parseInt(seed, 10)
//   draw N faces = floor(next * N) + 1  where next = state / 2^32
//
// The session PRNG is seeded once at startup from TTRPG_SEED (default 0).
// Per-call seeds use an ISOLATED draw: they never advance the session PRNG
// position (REQ-050b).

export interface Rng {
  nextState(): number;
  // Draw an integer in [1, faces]
  roll(faces: number): number;
}

export function createRng(seed: number | string): Rng {
  let state = typeof seed === "number" ? seed : parseInt(String(seed), 10);
  if (!Number.isFinite(state) || Number.isNaN(state)) state = 0;
  state = state >>> 0; // keep as 32-bit unsigned
  return {
    nextState(): number {
      // state <- (state * 1664525 + 1013904223) mod 2^32, computed in 64-bit
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state;
    },
    roll(faces: number): number {
      const s = this.nextState();
      return Math.floor((s / 0x100000000) * faces) + 1;
    },
  };
}

// Session PRNG — seeded once from TTRPG_SEED (default 0). Advances with each
// session-seeded draw. Per-call seeds construct a fresh isolated Rng instead.
const SESSION_SEED = process.env.TTRPG_SEED ?? "0";
const sessionRng = createRng(SESSION_SEED);

// Log the active seed at startup (REQ-050b) so operators can verify determinism.
console.error(
  `[info] PRNG seed: ${SESSION_SEED} (source: ${process.env.TTRPG_SEED ? "env" : "default"})`,
);

// Session draw — advances the session PRNG position.
export function sessionRoll(faces: number): number {
  return sessionRng.roll(faces);
}

// Roll NdM (drop-lowest support) with a given Rng. Returns per-die results.
export interface DiceRoll {
  dice: number[];
  total: number;
}

export function rollWithRng(rng: Rng, count: number, sides: number, dropLowest = 0): DiceRoll {
  const dice: number[] = [];
  for (let i = 0; i < count; i++) dice.push(rng.roll(sides));
  if (dropLowest > 0 && dice.length >= 1) {
    const sorted = [...dice].sort((a, b) => a - b);
    for (let i = 0; i < dropLowest; i++) {
      const idx = dice.indexOf(sorted[i]);
      if (idx >= 0) dice.splice(idx, 1);
    }
  }
  return { dice, total: dice.reduce((a, b) => a + b, 0) };
}

// Roll a dice notation string like "4d6" or "3d6+2" against a given Rng.
export function rollNotationWithRng(rng: Rng, notation: string): { dice: number[]; total: number; modifier: number } {
  const m = String(notation).trim().match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
  if (!m) throw new Error(`Invalid dice notation '${notation}'.`);
  const count = parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  const res = rollWithRng(rng, count, sides);
  const sign = m[3] === "-" ? -1 : 1;
  const modifier = m[4] ? sign * parseInt(m[4], 10) : 0;
  return { dice: res.dice, total: res.total + modifier, modifier };
}

// Deterministic 4d6 drop-lowest ability roll for stat generation (REQ-104c).
// Uses an ISOLATED Rng so it does not advance the session PRNG position.
export function roll4d6DropLowest(seed: string): number[] {
  const rng = createRng(seed);
  const res = rollWithRng(rng, 4, 6, 1);
  return res.dice;
}
