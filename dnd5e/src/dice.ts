// Deterministic PRNG — Linear Congruential Generator (1664525/1013904223)
// REQ-050: same seed + same call sequence = same results

let state: number = Date.now();

export function seed(rng_seed: number): void {
  // unsigned 32-bit wrapping
  state = rng_seed >>> 0;
}

export function next(): number {
  state = Math.imul(1664525, state) + 1013904223;
  state >>>= 0;
  return state;
}

export function random(): number {
  return (next() % 0x7fffffff) / 0x7fffffff;
}

export function rollD20(): number {
  return 1 + Math.floor(random() * 20);
}

export function rollDice(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += 1 + Math.floor(random() * sides);
  }
  return total;
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(1 + level / 4);
}

export function getState(): number {
  return state;
}

export function snapshotSeed(): number {
  return state;
}

export function withIsolatedSeed<T>(perCallSeed: number, fn: () => T): T {
  const saved = state;
  seed(perCallSeed);
  try {
    return fn();
  } finally {
    state = saved;
  }
}
