import { PRNG, rollD20, rollDice, abilityModifier, proficiencyBonus } from "../../src/dice.js";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const rng = new PRNG("test-seed-1");
const r = rng.next();
assert("PRNG produces value in [0,1)", r >= 0 && r < 1, `got ${r}`);

const rng2 = new PRNG("test-seed-1");
assert("Same seed produces same sequence", rng2.next() === r);

const d20_1 = rollD20(new PRNG("d20-test"));
assert("rollD20 produces 1-20", d20_1 >= 1 && d20_1 <= 20, `got ${d20_1}`);

const rngA = new PRNG("adv-test");
const adv = rollD20(rngA, true);
assert("rollD20 advantage gives result 1-20", adv >= 1 && adv <= 20);

const dice = rollDice(new PRNG("dice-test"), 3, 6);
assert("rollDice produces correct count", dice.length === 3, `got ${dice.length}`);
assert("rollDice produces values 1-6", dice.every(d => d >= 1 && d <= 6), dice.join(","));

assert("abilityModifier 10 = 0", abilityModifier(10) === 0);
assert("abilityModifier 12 = 1", abilityModifier(12) === 1);
assert("abilityModifier 8 = -1", abilityModifier(8) === -1);
assert("abilityModifier 18 = 4", abilityModifier(18) === 4);

assert("proficiencyBonus 1 = 2", proficiencyBonus(1) === 2);
assert("proficiencyBonus 4 = 2", proficiencyBonus(4) === 2);
assert("proficiencyBonus 5 = 3", proficiencyBonus(5) === 3);
assert("proficiencyBonus 20 = 6", proficiencyBonus(20) === 6);

console.log(`dice tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
