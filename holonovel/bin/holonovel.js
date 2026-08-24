#!/usr/bin/env node
import("../dist/index.js").catch((e) => {
  console.error("holonovel failed to start:", e);
  process.exit(1);
});
