import { StateManager, DnDEntity } from "../../src/state.js";
import * as fs from "node:fs";
import * as path from "node:path";

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

const DATA_DIR = ".holonovel-state-test-novel";

// --- Create novel ---
const sm1 = new StateManager("seed-1", DATA_DIR);
const novel1 = sm1.createNovel("The Epic Quest");
assert("create_novel returns novel", novel1 !== null);
assert("create_novel slug", novel1.slug === "the-epic-quest");
assert("novel not ended", novel1.ended === false);

// --- Create character in novel ---
const entityId = sm1.generateNextEntityId();
const entity: DnDEntity = {
  id: entityId,
  name: "Aragorn",
  race: "human",
  className: "ranger",
  level: 1,
  stats: { strength: 14, dexterity: 16, constitution: 14, intelligence: 12, wisdom: 15, charisma: 10 },
  maxHp: 12, currentHp: 12, tempHp: 0,
  hitDice: { total: 1, remaining: 1, size: 10 },
  armorClass: 14,
  speed: 30,
  initiative: 3,
  skills: ["stealth", "survival", "perception"],
  saveProficiencies: ["strength", "dexterity"],
  conditions: [],
  inventory: ["longbow", "shortsword"],
  equippedWeapons: ["longbow"],
  equippedArmor: "leather",
  spellSlots: {},
  personality: { background: "outlander" },
};
sm1.addToRoster(entity);

const novelAfterChar = sm1.getActiveNovel();
assert("entity in novel", novelAfterChar?.entities[entityId]?.name === "Aragorn");
assert("roster has entity", sm1._roster[entityId] !== undefined);

// --- End novel ---
sm1.endNovel();
const afterEnd = sm1.getActiveNovel();
assert("ended novel returns null from getActiveNovel", afterEnd === null);

// --- Verify save file removed ---
const novelPath = path.join(DATA_DIR, "novels", "the-epic-quest.json");
assert("save file removed after endNovel", !fs.existsSync(novelPath));

// --- Create another novel ---
const sm2 = new StateManager("seed-2", DATA_DIR);
const novel2 = sm2.createNovel("Second Story");
assert("create second novel works", novel2.slug === "second-story");

sm2.endNovel();
fs.rmSync(DATA_DIR, { recursive: true, force: true });
assert("temp dir cleaned", !fs.existsSync(DATA_DIR));

console.log(`novel lifecycle tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
