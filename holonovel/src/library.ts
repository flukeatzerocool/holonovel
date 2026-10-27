// Library entry point for build-time consumers (REQ-389, REQ-614).
// Importing this module never starts the MCP server; the executable entry is
// `dist/index.js` (bin/holonovel.js).
export * as core from "./core/index.js";
export * as world from "./world/index.js";
