import { McpTestClient, assertOk } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();

    const listResp = await client.listResources();
    const resources = listResp.result?.resources || [];
    assert.ok(Array.isArray(resources), "listResources returns resources array");

    const hasRuleset = resources.some(
      (r: any) =>
        (typeof r.uri === "string" && r.uri.startsWith("ruleset://")) ||
        (typeof r.uri === "string" && r.uri.includes("ruleset"))
    );
    assert.ok(hasRuleset, "listResources includes ruleset:// resource");

    console.log("T16 PASSED");
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error("T16 FAILED:", e);
    await client.close();
    process.exit(1);
  }
}

main();
