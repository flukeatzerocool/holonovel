import { McpTestClient, assertError } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();

    const resp = await client.toolCall("lookup_spell", { name: "zzznotexist" });
    const errText = await assertError(resp, "unknown spell lookup");

    const notFound = errText.toUpperCase().includes("NOT_FOUND")
      || errText.toLowerCase().includes("not found")
      || errText.toLowerCase().includes("unknown");
    assert.ok(notFound, "unknown lookup returns NOT_FOUND or equivalent");

    console.log("T40 PASSED");
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error("T40 FAILED:", e);
    await client.close();
    process.exit(1);
  }
}

main();
