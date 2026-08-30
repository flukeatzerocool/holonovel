#!/usr/bin/env npx tsx
/**
 * newsletter-push.ts — push the latest newsletter draft to Buttondown as a draft. [build tool]
 *
 * Requires BUTTONDOWN_API_KEY; never sends on its own. Exit codes: 0 =
 * pushed as draft, 1 = missing key, missing draft, or API failure.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

// Pushes the latest newsletter draft to Buttondown as a *draft* (status
// "draft"), so a human reviews and sends it from the Buttondown dashboard.
// Semi-automated by design: this script never sends on its own.
//
// Requires BUTTONDOWN_API_KEY in the environment (a Buttondown API token).

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

async function main(): Promise<void> {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.error("FAIL  BUTTONDOWN_API_KEY is not set.");
    process.exit(1);
  }

  const date = process.argv[2] ?? today();
  const draftPath = join(root, "newsletter", "drafts", `${date}.md`);
  if (!existsSync(draftPath)) {
    console.error(`FAIL  no draft at ${draftPath}`);
    process.exit(1);
  }
  const body = readFileSync(draftPath, "utf-8");
  const subject = `Holonovel newsletter — ${date}`;

  const res = await fetch("https://api.buttondown.com/v1/emails", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subject, body, status: "draft" }),
  });

  if (!res.ok) {
    console.error(`FAIL  Buttondown returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const data = (await res.json()) as { id?: string; status?: string };
  console.log(`OK  draft created (id=${data.id}, status=${data.status}).`);
  console.log("    Review and send/schedule it from the Buttondown dashboard.");
}

main();
