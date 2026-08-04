import { McpTestClient, assertOk } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();

    const resp = await client.toolCall("spec_health", {});
    const text = await assertOk(resp, "spec_health");

    const hasConfidence = text.toLowerCase().includes("confidence")
      || text.toLowerCase().includes("coverage")
      || text.toLowerCase().includes("%");
    assert.ok(hasConfidence, "spec_health mentions confidence or coverage");

    console.log("T45 PASSED");
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error("T45 FAILED:", e);
    await client.close();
    process.exit(1);
  }
}

main();
