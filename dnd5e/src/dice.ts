export class PRNG {
  private state: number;
  private initialSeed: string;

  constructor(seed: string) {
    this.initialSeed = seed;
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    this.state = (h >>> 0) || 1;
  }

  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) | 0;
    return (this.state >>> 0) / 4294967296;
  }

  nextRange(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  reseed(seed: string): void {
    this.initialSeed = seed;
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    this.state = (h >>> 0) || 1;
  }

  getSeed(): string {
    return this.initialSeed;
  }
}

export function seedFromString(s: string): PRNG {
  return new PRNG(s);
}

export function rollD20(rng: PRNG, advantage: boolean = false): number {
  if (advantage) {
    return Math.max(rng.nextRange(1, 20), rng.nextRange(1, 20));
  }
  return rng.nextRange(1, 20);
}

export function rollDice(rng: PRNG, count: number, sides: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(rng.nextRange(1, sides));
  }
  return results;
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function formatRoll(dice: number[], modifier: number): { total: number; breakdown: string } {
  const sum = dice.reduce((a, b) => a + b, 0);
  const total = sum + modifier;
  const sign = modifier >= 0 ? "+" : "";
  const breakdown = `${dice.length}d${dice[0] !== undefined ? "?" : "?"} = [${dice.join(", ")}]${modifier !== 0 ? ` ${sign}${modifier}` : ""}`;
  return { total, breakdown };
}
