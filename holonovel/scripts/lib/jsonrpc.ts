// jsonrpc.ts — shared JSON-RPC snippet helpers for the raw-stdio harnesses.
//
// Several harnesses speak JSON-RPC over stdio with a local `send` closure
// rather than the full McpClient. This module holds the snippet helpers those
// harnesses previously duplicated: a `resources/read` reader. Pure transport;
// no oracle logic. Exit codes: n/a (library).
//
// REQ citations: none — informational harness support.

export type LenientSend = (proc: any, msg: Record<string, unknown>) => Promise<any>;

export interface ResourceReaderOptions {
  errorLabel?: string;
  throwOnError?: boolean;
}

// Read a resource and join its `contents[].text`. `throwOnError` defaults true;
// pass false for harnesses that treat an RPC error as an empty result.
export async function readResource(
  send: LenientSend,
  proc: any,
  uri: string,
  opts: ResourceReaderOptions = {},
): Promise<string> {
  const resp = await send(proc, { method: "resources/read", params: { uri } });
  if (resp.error && opts.throwOnError !== false) {
    throw new Error(`${opts.errorLabel ?? "RPC error"}: ${JSON.stringify(resp.error)}`);
  }
  const content = resp.result?.contents ?? [];
  return content.map((c: any) => c?.text ?? "").join("\n");
}

// Bind a harness's local `send` into a `(proc, uri) => Promise<string>` reader.
export function resourceReader(send: LenientSend, opts: ResourceReaderOptions = {}): (proc: any, uri: string) => Promise<string> {
  return (proc, uri) => readResource(send, proc, uri, opts);
}

// Read a prompt and join its `messages[].content.text`. Shared by the
// harnesses that render `badge_briefing` and assert on section content.
export async function readPrompt(
  send: LenientSend,
  proc: any,
  name: string,
  args: Record<string, unknown> = {},
): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name, arguments: args } });
  if (resp.error) throw new Error(`prompts/get ${name}: ${JSON.stringify(resp.error)}`);
  const messages = resp.result?.messages ?? [];
  return messages.map((m: any) => m?.content?.text ?? "").join("\n");
}

// Bind a harness's local `send` into a `(proc, name, args?) => Promise<string>` reader.
export function promptReader(send: LenientSend): (proc: any, name: string, args?: Record<string, unknown>) => Promise<string> {
  return (proc, name, args = {}) => readPrompt(send, proc, name, args);
}
