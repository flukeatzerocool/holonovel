#!/usr/bin/env node
// Launcher. `holonovel update` reconciles persisted data and packages to the
// current format fingerprints (REQ-650); any other invocation starts the MCP
// server, preserving the historical behavior.
const sub = process.argv[2];
if (sub === "update" || sub === "migrate") {
  import("../dist/cli/update.js")
    .then((mod) => {
      process.exitCode = mod.main(process.argv.slice(3));
    })
    .catch((e) => {
      console.error("holonovel update failed to start:", e);
      process.exit(1);
    });
} else if (sub === "help" || sub === "--help" || sub === "-h") {
  console.log("Usage: holonovel [update [--dry-run] [--json] [--data-only] [--packages-only]]");
  console.log("Start the MCP server: holonovel");
} else {
  import("../dist/index.js").catch((e) => {
    console.error("holonovel failed to start:", e);
    process.exit(1);
  });
}
