import { McpTestClient, assertOk, assertError } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();

    await assertOk(
      await client.toolCall("set_persona", { persona: "player" }),
      "set player"
    );

    const combatResp = await client.toolCall("init_combat", { participants: ["none"] });
    const errText = await assertError(combatResp, "player init_combat blocked");

    assert.ok(
      errText.toUpperCase().includes("FORBIDDEN")
        || errText.toLowerCase().includes("forbidden")
        || errText.toLowerCase().includes("cannot")
        || errText.toLowerCase().includes("permission"),
      "GM tool blocked for player"
    );

    console.log("T44 PASSED");
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error("T44 FAILED:", e);
    await client.close();
    process.exit(1);
  }
}

main();
