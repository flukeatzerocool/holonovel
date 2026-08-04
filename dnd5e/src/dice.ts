// Deterministic PRNG (LCG with 1664525/1013904223) — seedable, reproducible
export class PRNG {
  private state: number;

  constructor(seed: string) {
    this.state = parseInt(seed, 10) || 0;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) | 0;
    return (this.state >>> 0) / 4294967296;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  nextRange(min: number, max: number): number {
    return min + this.nextInt(max - min + 1);
  }

  reseed(seed: string): void {
    this.state = parseInt(seed, 10) || 0;
  }
}

export function rollD20(rng: PRNG): number {
  return rng.nextRange(1, 20);
}

export function rollDice(rng: PRNG, notation: string): { faces: number[]; total: number } {
  const match = notation.match(/^(\d+)d(\d+)(.*)$/);
  if (!match) throw new Error(`Invalid dice notation: ${notation}`);
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const rest = match[3] || "";
  const faces: number[] = [];
  for (let i = 0; i < count; i++) {
    faces.push(rng.nextRange(1, sides));
  }
  let total = faces.reduce((a, b) => a + b, 0);
  const modMatch = rest.match(/^([+-]\d+)$/);
  if (modMatch) {
    total += parseInt(modMatch[1]);
  }
  return { faces, total };
}

export function rollAdvantage(rng: PRNG): { rolls: number[]; result: number; advantage: boolean } {
  const r1 = rollD20(rng);
  const r2 = rollD20(rng);
  return { rolls: [r1, r2], result: Math.max(r1, r2), advantage: true };
}

export function rollDisadvantage(rng: PRNG): { rolls: number[]; result: number; advantage: boolean } {
  const r1 = rollD20(rng);
  const r2 = rollD20(rng);
  return { rolls: [r1, r2], result: Math.min(r1, r2), advantage: false };
}

export function formatRoll(dice: string, faces: number[], total: number): string {
  return `Dice: ${dice} = [${faces.join(", ")}]\nTotal: ${total}`;
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}
