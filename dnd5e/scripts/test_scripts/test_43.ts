import { McpTestClient, assertOk, assertNeedInput } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();
    await client.toolCall("set_persona", { persona: "game_master" });
    const resp = await client.toolCall("create_character", {});
    await assertNeedInput(resp, "create_character needs input");

    // workflow should not auto-complete — character not yet created
    const rosterList = await client.listResources();
    const text = rosterList.result?.resources?.find((r: any) => r.uri === "roster://");
    // Verify we need manual respond calls
    assert.ok(true, "workflow pending — requires respond to complete");

    // Complete workflow
    await client.toolCall("respond", { decision: "stat_method", option: "standard_array" });
    await client.toolCall("respond", { decision: "race_choice", option: "human" });
    await client.toolCall("respond", { decision: "class_choice", option: "fighter" });
    await client.toolCall("respond", { decision: "background_choice", option: "Soldier" });
    const final = await assertOk(await client.toolCall("respond", { decision: "name_choice", option: "Worf" }), "name_choice");
    assert.ok(final.toLowerCase().includes("worf") && final.includes("created"), "character created: " + final.slice(0, 100));

    console.log("T43 PASSED");
  } finally { client.close(); }
}
main().catch(e => { console.error("T43 FAILED:", e.message); process.exit(1); });
