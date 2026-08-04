import { McpTestClient, assertOk, assertError } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();
    let t = assertOk(await client.toolCall("set_persona", { persona: "game_master" }), "set GM");
    assert.ok(t.includes("Game Master"), "should show GM");

    t = assertOk(await client.toolCall("set_persona", { persona: "player" }), "set player");
    assert.ok(t.includes("Player"), "should show Player");

    // player blocked from GM tools
    const cResp = await client.toolCall("init_combat", { participants: [] });
    assert.ok(cResp.result.content[0].text.startsWith("[ERROR]"), "player blocked from init_combat");

    // switch back
    await client.toolCall("set_persona", { persona: "game_master" });

    // GM can init combat with a danger
    const gmResp = await assertOk(await client.toolCall("init_combat", { participants: [], dangers: [{ name: "Goblin", ac: 15, hp: 7 }] }), "GM init_combat");

    console.log("T9 PASSED");
  } finally { client.close(); }
}
main().catch(e => { console.error("T9 FAILED:", e.message); process.exit(1); });
