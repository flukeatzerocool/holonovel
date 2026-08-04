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
    const finalResp = await client.toolCall("respond", { decision: "name_choice", option: "UndoTest" });
    const rosterMatch = finalResp.result.content[0].text.match(/roster:\/\/(e\d+)/);
    assert.ok(rosterMatch, "should have roster ID");
    const eid = rosterMatch![1];
    await client.toolCall("import_character", { roster_id: eid });

    await client.toolCall("apply_condition", { entity_id: eid, condition: "prone" });
    let sheet = await client.toolCall("character_sheet", { entity_id: eid });
    assert.ok(sheet.result.content[0].text.includes("prone"), "condition should be visible");

    await assertOk(await client.toolCall("undo", {}), "undo");
    sheet = await client.toolCall("character_sheet", { entity_id: eid });
    assert.ok(!sheet.result.content[0].text.includes("prone"), "condition should be gone after undo");

    console.log("T10 PASSED");
  } finally { client.close(); }
}
main().catch(e => { console.error("T10 FAILED:", e.message); process.exit(1); });
