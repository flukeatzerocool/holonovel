import { StateManager } from "../../src/state.js";
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

const DATA_DIR = ".holonovel-state-test-state";
const sm = new StateManager("test-state-seed", DATA_DIR);

assert("build fingerprint has specVersion 2.1.0", sm.buildFingerprint.specVersion === "2.1.0");
assert("build fingerprint has rulesetHash", typeof sm.buildFingerprint.rulesetHash === "string" && sm.buildFingerprint.rulesetHash.length > 0);
assert("build fingerprint has buildTimestamp", typeof sm.buildFingerprint.buildTimestamp === "string");

const novel = sm.createNovel("Test Novel State");
assert("createNovel returns novel", novel !== null);
assert("createNovel has slug", novel.slug === "test-novel-state");
assert("createNovel has name", novel.name === "Test Novel State");

const active = sm.getActiveNovel();
assert("getActiveNovel returns novel", active !== null);
assert("getActiveNovel matches", active?.slug === "test-novel-state");

const novel2 = sm.createNovel("Another Tale");
assert("createNovel second novel", novel2.slug === "another-tale");

sm.audit("game_master", "test_3", { action: "test" }, "OK");
const auditedNovel = sm.getActiveNovel();
assert("audit records entry", auditedNovel !== null && auditedNovel!.auditLog.length === 1);
assert("audit has correct tool", auditedNovel?.auditLog[0]?.tool === "test_3");

sm.snapshot();
const snapNovel = sm.getActiveNovel();
sm.setPersona("game_master");
sm.audit("game_master", "test_mutation", {}, "after_snapshot");

const undoResult = sm.undo();
assert("undo returns snapshot", undoResult !== null);

sm.saveState(novel.slug);
const novelsDir = path.join(DATA_DIR, "novels");
const saveFile = path.join(novelsDir, `${novel.slug}.json`);
assert("atomic save produces .json file", fs.existsSync(saveFile));

const sm2 = new StateManager("load-test-seed", DATA_DIR);
const resumed = sm2.resumeNovel(novel.slug);
assert("resumeNovel loads from disk", resumed !== null);
assert("resumed novel has same slug", resumed?.slug === novel.slug);
assert("resumed novel has same name", resumed?.name === novel.name);

const novels = sm2.listNovels();
assert("listNovels returns array", Array.isArray(novels));
const found = novels.filter(n => n.slug === novel.slug);
assert("listNovels includes novel", found.length >= 1);

sm.endNovel();
const afterEnd = sm.getActiveNovel();
assert("endNovel makes getActiveNovel null", afterEnd === null);

fs.rmSync(DATA_DIR, { recursive: true, force: true });

console.log(`state tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
