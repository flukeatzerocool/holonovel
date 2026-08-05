import { expandMacros } from "../../src/macros.js";
import { StateManager, DnDEntity } from "../../src/state.js";
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

const DATA_DIR = ".holonovel-state-test-macros";
const sm = new StateManager("macro-seed", DATA_DIR);
const novel = sm.createNovel("Macro Test");

const entityId = sm.generateNextEntityId();
const entity: DnDEntity = {
  id: entityId,
  name: "Gandalf",
  race: "human",
  className: "wizard",
  level: 1,
  stats: { strength: 10, dexterity: 12, constitution: 13, intelligence: 17, wisdom: 15, charisma: 14 },
  maxHp: 8, currentHp: 8, tempHp: 0,
  hitDice: { total: 1, remaining: 1, size: 6 },
  armorClass: 11,
  speed: 30,
  initiative: 1,
  skills: ["arcana", "history", "investigation"],
  saveProficiencies: ["intelligence", "wisdom"],
  conditions: [],
  inventory: ["quarterstaff"],
  equippedWeapons: ["quarterstaff"],
  equippedArmor: "",
  spellSlots: {},
  personality: { background: "sage" },
};
sm.addToRoster(entity);
if (novel) novel.activeEntityId = entity.id;
novel.scene.description = "You stand before the gates of Moria.";
novel.scene.type = "exploration";
sm.setPersona("game_master");

assert("{{entity.name}} expands", expandMacros("{{entity.name}}", sm) === "Gandalf");
assert("{{entity.hp}} expands", expandMacros("{{entity.hp}}", sm) === "8/8");
assert("{{entity.strength}} expands", expandMacros("{{entity.strength}}", sm) === "10");
assert("{{entity.intelligence}} expands", expandMacros("{{entity.intelligence}}", sm) === "17");

assert("{{scene.current}} expands", expandMacros("{{scene.current}}", sm) === "You stand before the gates of Moria.");
assert("{{scene.type}} expands", expandMacros("{{scene.type}}", sm) === "exploration");

assert("{{novel.slug}} expands", expandMacros("{{novel.slug}}", sm) === "macro-test");

assert("{{persona.active}} expands", expandMacros("{{persona.active}}", sm) === "game_master");

assert("{{party.size}} expands", expandMacros("{{party.size}}", sm) === "1");

const unknown = expandMacros("{{foo.bar.baz}}", sm);
assert("unknown macro stays as literal", unknown === "{{foo.bar.baz}}");

const combined = expandMacros("{{entity.name}} has {{entity.hp}} HP", sm);
assert("combined macros expand", combined === "Gandalf has 8/8 HP");

sm.endNovel();
fs.rmSync(DATA_DIR, { recursive: true, force: true });

console.log(`macro tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
