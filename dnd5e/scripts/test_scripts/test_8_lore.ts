import { StateManager } from "../../src/state.js";
import type { LoreEntry } from "../../src/state.js";
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

const DATA_DIR = ".holonovel-state-test-lore";
const sm = new StateManager("lore-seed", DATA_DIR);
const novel = sm.createNovel("Lore Test");
sm.setPersona("game_master");

const key = "dragon-lair";
const content = "The lair of the ancient red dragon. The walls are lined with gold.";
const triggers = ["dragon", "lair", "mountain"];

// set lore entry
novel.loreEntries[key] = {
  key,
  content,
  triggers,
  persona_scope: "game_master",
  priority: 5,
  enabled: true,
};
const entry = novel.loreEntries[key] as LoreEntry;
assert("set lore entry exists", entry !== undefined);
assert("lore entry has content", entry.content === content);
assert("lore entry has triggers", entry.triggers.length === triggers.length);
assert("lore entry enabled by default", entry.enabled === true);

// toggle lore entry
novel.loreEntries[key] = { ...entry, enabled: false };
const toggledOff = novel.loreEntries[key] as LoreEntry;
assert("toggle lore entry off", toggledOff.enabled === false);
assert("disabled entry still exists", toggledOff.key === key);
assert("disabled entry retains content", toggledOff.content === content);

novel.loreEntries[key] = { ...toggledOff, enabled: true };
const toggledOn = novel.loreEntries[key] as LoreEntry;
assert("toggle lore entry back on", toggledOn.enabled === true);

// set lore group
novel.loreEntries[key] = { ...toggledOn, group: "dragons" };
const grouped = novel.loreEntries[key] as LoreEntry;
assert("set lore group", grouped.group === "dragons");

novel.loreEntries[key] = { ...grouped, group: undefined };
const ungrouped = novel.loreEntries[key] as LoreEntry;
assert("remove lore group set to undefined", ungrouped.group === undefined);

// remove lore entry
delete novel.loreEntries[key];
assert("remove lore entry", novel.loreEntries[key] === undefined);

// add a shared entry
novel.loreEntries["town-rumor"] = {
  key: "town-rumor",
  content: "A mysterious stranger arrived last night.",
  triggers: ["town", "inn"],
  persona_scope: "shared",
  enabled: true,
};
assert("shared lore entry created", novel.loreEntries["town-rumor"]?.persona_scope === "shared");

// add a disabled entry
novel.loreEntries["secret"] = {
  key: "secret",
  content: "GM eyes only.",
  triggers: ["hidden"],
  persona_scope: "game_master",
  enabled: false,
};
const disabledEntry = novel.loreEntries["secret"] as LoreEntry;
assert("disabled entry exists but is disabled", disabledEntry !== undefined && disabledEntry.enabled === false);

sm.endNovel();
fs.rmSync(DATA_DIR, { recursive: true, force: true });

console.log(`lore tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
