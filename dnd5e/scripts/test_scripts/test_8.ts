import { McpTestClient, assertOk, assertNeedInput } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();
    await client.toolCall("set_persona", { persona: "game_master" });
    await assertNeedInput(await client.toolCall("create_character", {}), "create_character");
    await client.toolCall("respond", { decision: "stat_method", option: "standard_array" });
    await client.toolCall("respond", { decision: "race_choice", option: "human" });
    await client.toolCall("respond", { decision: "class_choice", option: "fighter" });
    await client.toolCall("respond", { decision: "background_choice", option: "Soldier" });
    const final = await assertOk(await client.toolCall("respond", { decision: "name_choice", option: "Aldric" }), "name_choice");
    const match = final.match(/roster:\/\/(e\d+)/);
    assert.ok(match, "should have roster ID");
    const eid = match![1];
    await client.toolCall("import_character", { roster_id: eid });

    await assertOk(await client.toolCall("roll_skill_check", { skill: "athletics", entity_id: eid, seed: "42" }), "skill check");
    const recap = await client.toolCall("session_recap", {});
    const text = assertOk(recap, "session_recap");
    assert.ok(text.includes("Aldric") || text.includes("athletics") || text.includes("roll"), "recap mentions activity: " + text.slice(0, 100));
    console.log("T8 PASSED");
  } finally { client.close(); }
}
main().catch(e => { console.error("T8 FAILED:", e.message); process.exit(1); });
