import { StateManager, DnDEntity } from "../../src/state.js";
import { abilityModifier, proficiencyBonus } from "../../src/dice.js";
import { CLASS_HIT_DIE, CLASS_SAVES, ABILITY_SCORES } from "../../src/data.js";
import * as fs from "node:fs";

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

const DATA_DIR = ".holonovel-state-test-char";
const sm = new StateManager("test-char", DATA_DIR);
sm.createNovel("Character Test");

const entityId = sm.generateNextEntityId();
const entity: DnDEntity = {
  id: entityId,
  name: "Thorin",
  race: "dwarf",
  className: "fighter",
  level: 3,
  stats: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 13, charisma: 8 },
  maxHp: 28, currentHp: 28, tempHp: 0,
  hitDice: { total: 3, remaining: 3, size: 10 },
  armorClass: 16,
  speed: 25,
  initiative: 1,
  skills: ["athletics", "intimidation"],
  saveProficiencies: ["strength", "constitution"],
  conditions: [],
  inventory: ["longsword", "shield", "chain mail"],
  equippedWeapons: ["longsword"],
  equippedArmor: "chain mail",
  spellSlots: {},
  personality: { background: "soldier" },
};

sm.addToRoster(entity);
assert("addToRoster adds to roster", entity.id in sm._roster);

const novel = sm.getActiveNovel();
assert("entity in novel after addToRoster", novel !== null && entity.id in novel!.entities);

sm.createNovel("Import Test");
const imported = sm.importFromRoster(entity.id);
assert("importFromRoster returns entity", imported !== null);
assert("importFromRoster name matches", imported?.name === "Thorin");
assert("activeEntityId set after import", sm.getActiveNovel()?.activeEntityId === entity.id);

const activeNovel = sm.getActiveNovel();
if (activeNovel) {
  activeNovel.activeEntityId = entity.id;
}
sm.setPersona("game_master");
const active = sm.getActiveEntity();
assert("getActiveEntity returns entity", active !== null);
assert("getActiveEntity name matches", active?.name === "Thorin");

const found = sm.findEntity(entity.id);
assert("findEntity finds entity", found !== null);
assert("findEntity returns same id", found?.id === entity.id);

assert("abilityModifier: 16 → +3", abilityModifier(16) === 3);
assert("abilityModifier: 8 → -1", abilityModifier(8) === -1);
assert("proficiencyBonus: level 3 → +2", proficiencyBonus(3) === 2);
assert("CLASS_HIT_DIE fighter = 10", CLASS_HIT_DIE.fighter === 10);

const fighterSaves = CLASS_SAVES.fighter;
assert("CLASS_SAVES fighter is array", Array.isArray(fighterSaves));
assert("CLASS_SAVES fighter length 2", fighterSaves.length === 2);

sm.endNovel();
fs.rmSync(DATA_DIR, { recursive: true, force: true });

console.log(`character tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
