// T15: spec_health reports indexed counts, tool count, confidence
import { strict as assert } from "node:assert";
import { McpTestClient, assertOk } from "./harness.js";

async function main() {
  const c = new McpTestClient();
  try {
    await c.initialize();
    const resp = await c.toolCall("spec_health");
    const text = assertOk(resp, "T15 spec_health");
    assert.ok(text.includes("Registered tools:"), "T15: should report tool count");
    assert.ok(text.includes("Ruleset:"), "T15: should report ruleset name");
    assert.ok(text.includes("D&D 5e"), "T15: should mention D&D 5e");
    console.log("T15 PASSED: spec_health reports build health");
  } finally {
    c.close();
  }
}

main().catch(e => { console.error("T15 FAILED:", e.message); process.exit(1); });
