import { McpTestClient, assertOk } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();
    await client.toolCall("set_persona", { persona: "game_master" });
    const resp = await client.toolCall("help", { query: "combat" });
    const text = resp.result.content[0].text;
    assert.ok(text.includes("Combat") || text.includes("combat") || text.includes("init_combat") || text.includes("advance_combat") || text.includes("end_combat"), "help combat includes combat tools: " + text.slice(0, 100));

    const resp2 = await client.toolCall("help", {});
    const text2 = resp2.result.content[0].text;
    assert.ok(text2.includes("Combat") || text2.includes("Lookup") || text2.includes("Dice"), "help has categories: " + text2.slice(0, 100));

    console.log("T62 PASSED");
  } finally { client.close(); }
}
main().catch(e => { console.error("T62 FAILED:", e.message); process.exit(1); });
