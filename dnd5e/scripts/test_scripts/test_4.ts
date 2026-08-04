// T4: roll_skill_check returns transparent dice + modifiers
import { strict as assert } from "node:assert";
import { McpTestClient, assertOk } from "./harness.js";

async function main() {
  const c = new McpTestClient();
  try {
    await c.initialize();
    // Set GM to create character
    await c.toolCall("set_persona", { persona: "game_master" });
    let resp = await c.toolCall("create_character");
    let text = assert.ok(resp.result.content[0].text.startsWith("[NEED_INPUT]"), "T4: should ask for stat method");
    resp = await c.toolCall("respond", { decision: "stat_method", option: "standard_array" });
    resp = await c.toolCall("respond", { decision: "race_choice", option: "human" });
    resp = await c.toolCall("respond", { decision: "class_choice", option: "fighter" });
    resp = await c.toolCall("respond", { decision: "background_choice", option: "Soldier" });
    resp = await c.toolCall("respond", { decision: "name_choice", option: "Testo" });
    const rosterId = resp.result.content[0].text.match(/roster:\/\/(e\d+)/);
    assert.ok(rosterId, "T4: should have roster ID");
    await c.toolCall("import_character", { roster_id: rosterId![1] });
    await c.toolCall("set_persona", { persona: "player" });

    resp = await c.toolCall("roll_skill_check", { skill: "athletics", entity_id: rosterId![1], dc: 15 });
    text = resp.result.content[0].text;
    assert.ok(text.startsWith("[OK]"), "T4: skill check should return OK");
    assert.ok(text.includes("athletics"), "T4: should name skill");
    assert.ok(text.includes("d20"), "T4: should show dice notation");
    assert.ok(text.includes("vs DC"), "T4: should show DC");
    console.log("T4 PASSED: roll_skill_check returns transparent output");
  } finally { c.close(); }
}
main().catch(e => { console.error("T4 FAILED:", e.message); process.exit(1); });
