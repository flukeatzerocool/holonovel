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
