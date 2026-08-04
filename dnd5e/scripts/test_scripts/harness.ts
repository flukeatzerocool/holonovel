// MCP test harness — spawns server, sends JSON-RPC over STDIO
import { spawn, ChildProcess } from "node:child_process";
import * as path from "node:path";
import * as assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_PATH = path.resolve(__dirname, "..", "..", "dist", "index.js");
const RULESET_DIR = path.resolve(__dirname, "..", "..", "ruleset");
const DATA_DIR = path.resolve(__dirname, "..", "..", ".holonovel-test-state");

export interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: { code: number; message: string };
}

export class McpTestClient {
  private proc: ChildProcess;
  private buffer = "";
  private pending: Map<number, { resolve: (r: JsonRpcResponse) => void; reject: (e: Error) => void }> = new Map();
  private nextId = 1;

  constructor(env?: Record<string, string>) {
    this.proc = spawn("node", [SERVER_PATH], {
      env: { ...process.env, TTRPG_GAME_ID: "test-gate4", TTRPG_DATA_DIR: DATA_DIR, TTRPG_SEED: "gate4-test", TTRPG_RULESET_DIR: RULESET_DIR, ...env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.proc.stdout!.on("data", (chunk: Buffer) => this.onData(chunk.toString()));
    this.proc.stderr!.on("data", (chunk: Buffer) => console.error("[SERVER STDERR]", chunk.toString().trim()));
  }

  private onData(data: string) {
    this.buffer += data;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          p.resolve(msg);
        }
      } catch { /* partial JSON */ }
    }
  }

  async call(method: string, params?: any): Promise<JsonRpcResponse> {
    const id = this.nextId++;
    const req = JSON.stringify({ jsonrpc: "2.0", id, method, params: params || {} });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin!.write(req + "\n");
    });
  }

  async initialize(): Promise<JsonRpcResponse> {
    return this.call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "gate4-test", version: "1.0" },
    });
  }

  async toolCall(name: string, args: Record<string, any> = {}): Promise<JsonRpcResponse> {
    return this.call("tools/call", { name, arguments: args });
  }

  async listTools(): Promise<JsonRpcResponse> {
    return this.call("tools/list");
  }

  async listPrompts(): Promise<JsonRpcResponse> {
    return this.call("prompts/list");
  }

  async getPrompt(name: string, args?: Record<string, any>): Promise<JsonRpcResponse> {
    return this.call("prompts/get", { name, arguments: args || {} });
  }

  async listResources(): Promise<JsonRpcResponse> {
    return this.call("resources/list");
  }

  close() {
    this.proc.stdin!.end();
    this.proc.kill();
  }
}

export function assertOk(resp: JsonRpcResponse, label: string) {
  assert.ok(!resp.error, `${label}: server error: ${resp.error?.message}`);
  const text = resp.result?.content?.[0]?.text || "";
  assert.ok(text.startsWith("[OK]"), `${label}: expected [OK] prefix, got: ${text.slice(0, 50)}`);
  return text;
}

export function assertError(resp: JsonRpcResponse, label: string, expectedCode?: string) {
  assert.ok(!resp.error, `${label}: transport error: ${resp.error?.message}`);
  const text = resp.result?.content?.[0]?.text || "";
  assert.ok(text.startsWith("[ERROR]"), `${label}: expected [ERROR] prefix, got: ${text.slice(0, 50)}`);
  if (expectedCode) {
    const match = text.match(/\[ERROR\]\s*\[(\w+)\]/);
    assert.ok(match && match[1] === expectedCode, `${label}: expected error code ${expectedCode}, got: ${text.slice(0, 80)}`);
  }
  return text;
}

export function assertNeedInput(resp: JsonRpcResponse, label: string) {
  assert.ok(!resp.error, `${label}: transport error: ${resp.error?.message}`);
  const text = resp.result?.content?.[0]?.text || "";
  assert.ok(text.startsWith("[NEED_INPUT]"), `${label}: expected [NEED_INPUT], got: ${text.slice(0, 50)}`);
  return text;
}
