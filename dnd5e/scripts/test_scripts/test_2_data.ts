import {
  buildSearchIndex, searchRules, lookupSpell, lookupWeapon, lookupMonster,
  lookupMagicItem, lookupEquipment, lookupClass, SearchIndexEntry,
} from "../../src/data.js";

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

const index = buildSearchIndex();
assert("buildSearchIndex returns array", Array.isArray(index));
assert("buildSearchIndex has entries", index.length > 0, `got ${index.length} entries`);

const first = index[0] as SearchIndexEntry;
assert("index entry has file", typeof first.file === "string" && first.file.length > 0);
assert("index entry has anchor", typeof first.anchor === "string" && first.anchor.length > 0);
assert("index entry has title", typeof first.title === "string" && first.title.length > 0);
assert("index entry has text", typeof first.text === "string" && first.text.length > 0);

const fireballResults = searchRules("fireball");
assert("searchRules('fireball') returns results", fireballResults.length > 0, `got ${fireballResults.length}`);

const spell = lookupSpell("Fireball");
assert("lookupSpell('Fireball') finds spell", spell !== null);
assert("lookupSpell('Fireball') has correct name", spell?.name?.toLowerCase() === "fireball");

const weapon = lookupWeapon("Longsword");
assert("lookupWeapon('Longsword') finds weapon", weapon !== null);

const monster = lookupMonster("Goblin");
assert("lookupMonster('Goblin') finds monster", monster !== null);
assert("lookupMonster('Goblin') has correct name", monster?.name === "Goblin");

const magicItem = lookupMagicItem("Potion of Healing");
assert("lookupMagicItem('Potion of Healing') finds item", magicItem !== null);

const equip = lookupEquipment("shield");
assert("lookupEquipment('shield') finds equipment", equip !== null);

const shieldByName = lookupEquipment("Shield");
assert("lookupEquipment('Shield') case-insensitive", shieldByName !== null);

const classInfo = lookupClass("wizard");
assert("lookupClass('wizard') returns info", classInfo !== null);
assert("lookupClass('wizard') has hitDie", classInfo?.hitDie === 6);
assert("lookupClass('wizard') has saves", Array.isArray(classInfo?.saves) && classInfo!.saves.length === 2);

const none = lookupSpell("nonexistent_spell_xyz_123");
assert("lookupSpell('nonexistent') returns null", none === null);

const noneClass = lookupClass("invalid_class");
assert("lookupClass('invalid') returns null", noneClass === null);

console.log(`data tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
