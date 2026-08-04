import { McpTestClient, assertOk } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();

    const swordResp = await client.toolCall("lookup_equipment", { name: "longsword" });
    const swordText = await assertOk(swordResp, "lookup longsword");
    assert.ok(
      swordText.toLowerCase().includes("sword") || swordText.toLowerCase().includes("longsword"),
      "longsword entry present"
    );

    const fireballResp = await client.toolCall("lookup_spell", { name: "fireball" });
    const fireballText = await assertOk(fireballResp, "lookup fireball");
    assert.ok(
      fireballText.toLowerCase().includes("fireball") || fireballText.toLowerCase().includes("fire"),
      "fireball entry present"
    );

    const goblinResp = await client.toolCall("lookup_monster", { name: "goblin" });
    const goblinText = await assertOk(goblinResp, "lookup goblin");
    assert.ok(
      goblinText.toLowerCase().includes("goblin"),
      "goblin entry present"
    );

    console.log("T39 PASSED");
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error("T39 FAILED:", e);
    await client.close();
    process.exit(1);
  }
}

main();
