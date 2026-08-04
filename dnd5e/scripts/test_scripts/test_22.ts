import { McpTestClient, assertOk } from "./harness.js";
import { strict as assert } from "node:assert";

async function main() {
  const client = new McpTestClient();
  try {
    await client.initialize();

    const promptsResp = await client.listPrompts();
    const prompts = promptsResp.result?.prompts || [];
    assert.ok(Array.isArray(prompts), "listPrompts returns prompts array");

    const intro = await client.getPrompt("intro");
    assert.ok(intro.result, "getPrompt intro returns result");
    const messages = intro.result?.messages || [];
    assert.ok(Array.isArray(messages), "intro has messages array");
    const userMessages = messages.filter((m: any) => m.role === "user");
    assert.strictEqual(userMessages.length, 1, "intro has exactly one user-role message");

    console.log("T22 PASSED");
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error("T22 FAILED:", e);
    await client.close();
    process.exit(1);
  }
}

main();
