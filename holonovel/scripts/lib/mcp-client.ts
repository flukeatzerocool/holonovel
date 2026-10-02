// mcp-client.ts — minimal stdio MCP client for the Holosuite tiers.
//
// Spawns the target server, performs JSON-RPC over stdio, and exposes
// tools/list, resources/list, prompts/list, and tools/call. Every call returns
// the joined text plus whether the SDK marked the result as an error. Pure
// transport; no oracle logic. Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support.

import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export interface CallResult {
  text: string;
  isError: boolean;
  raw: unknown;
}

export interface McpClient {
  dataDir: string;
  call(name: string, args?: Record<string, unknown>): Promise<CallResult>;
  listTools(): Promise<Array<{ name: string; title?: string; description?: string; inputSchema?: unknown; annotations?: Record<string, boolean> }>>;
  listResources(): Promise<unknown[]>;
  listPrompts(): Promise<unknown[]>;
  close(): Promise<void>;
}

interface Pending {
  resolve: (v: unknown) => void;
}

export async function bootServer(opts: { serverDir: string; dataDir?: string; seed?: number; env?: Record<string, string> }): Promise<McpClient> {
  const ownsDataDir = opts.dataDir === undefined;
  const dataDir = opts.dataDir ?? mkdtempSync(join(tmpdir(), "holosuite-"));
  const serverScript = join(opts.serverDir, "src", "index.ts");
  const proc: ChildProcess = spawn("npx", ["tsx", serverScript], {
    env: {
      ...process.env,
      TTRPG_DATA_DIR: dataDir,
      ...(opts.seed !== undefined ? { TTRPG_SEED: String(opts.seed) } : {}),
      ...(opts.env ?? {}),
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let msgId = 0;
  const pending = new Map<number, Pending>();
  let buffer = "";
  proc.stdout!.on("data", (d: Buffer) => {
    buffer += d.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let msg: { id?: number; result?: unknown; error?: unknown };
      try {
        msg = JSON.parse(line);
      } catch {
        continue; // non-JSON diagnostic on stdout; ignore.
      }
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)!.resolve(msg);
        pending.delete(msg.id);
      }
    }
  });

  function send(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve) => {
      const id = ++msgId;
      pending.set(id, { resolve });
      proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  await send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "holosuite", version: "1" } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 250));

  async function call(name: string, args: Record<string, unknown> = {}): Promise<CallResult> {
    const raw = (await send("tools/call", { name, arguments: args })) as {
      result?: { content?: Array<{ text?: string }>; isError?: boolean };
      error?: { message?: string };
    };
    if (raw.error) return { text: raw.error.message ?? "JSON-RPC error", isError: true, raw };
    const text = (raw.result?.content ?? []).map((c) => c.text ?? "").join("\n");
    return { text, isError: raw.result?.isError === true, raw };
  }

  async function listTools(): Promise<Array<{ name: string; title?: string; description?: string; inputSchema?: unknown; annotations?: Record<string, boolean> }>> {
    const raw = (await send("tools/list", {})) as { result?: { tools?: unknown[] } };
    return (raw.result?.tools ?? []) as Array<{ name: string }>;
  }

  async function listResources(): Promise<unknown[]> {
    const raw = (await send("resources/list", {})) as { result?: { resources?: unknown[] } };
    return raw.result?.resources ?? [];
  }

  async function listPrompts(): Promise<unknown[]> {
    const raw = (await send("prompts/list", {})) as { result?: { prompts?: unknown[] } };
    return raw.result?.prompts ?? [];
  }

  async function close(): Promise<void> {
    try {
      proc.kill("SIGKILL");
    } catch {
      // Process already exited; nothing to kill.
    }
    await new Promise((r) => setTimeout(r, 100));
    if (ownsDataDir) {
      try {
        rmSync(dataDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup of the temp dir; not a test signal.
      }
    }
  }

  return { dataDir, call, listTools, listResources, listPrompts, close };
}
