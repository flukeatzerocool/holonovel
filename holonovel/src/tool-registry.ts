// Tool registry — the single definition site for Holonovel's tool surface.
// A tool is defined once here; adapters bind to the registry and translate its
// definitions to their own transport. MCP is the reference adapter (`bindMcp`).
//
// REQ-548b — every registration carries an output schema; the caller supplies
// the default so the registry stays transport-neutral.

export interface ToolAnnotations {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
  [key: string]: unknown;
}

export interface ToolConfig {
  title?: string;
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  annotations: ToolAnnotations;
  [key: string]: unknown;
}

export type RegisteredToolHandler = (args: any, ctx: any) => Promise<any>;

export interface RegisteredTool {
  readonly name: string;
  readonly config: ToolConfig;
  readonly handler: RegisteredToolHandler;
}

/** The slice of `McpServer` the adapter needs; kept structural so the registry
 *  carries no SDK dependency. */
export interface McpServerLike {
  registerTool(name: string, config: any, handler: any): unknown;
}

/**
 * Insertion-ordered registry of tool definitions. Definitions are recorded, not
 * registered with any transport until an adapter binds. Defining after binding
 * registers the tool immediately, so a future dynamic install path cannot
 * silently miss the adapter's catalog.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();
  private adapter: ((tool: RegisteredTool) => unknown) | null = null;

  define(name: string, config: ToolConfig, handler: RegisteredToolHandler): void {
    if (this.tools.has(name)) {
      throw new Error(`Tool '${name}' is already registered`);
    }
    const tool: RegisteredTool = { name, config, handler };
    this.tools.set(name, tool);
    this.adapter?.(tool);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  names(): string[] {
    return [...this.tools.keys()];
  }

  list(): RegisteredTool[] {
    return [...this.tools.values()];
  }

  /** Attach an adapter sink. Idempotent: a second bind is ignored. */
  bind(register: (tool: RegisteredTool) => unknown): void {
    if (this.adapter) return;
    this.adapter = register;
    for (const tool of this.tools.values()) register(tool);
  }
}

/**
 * Bind the registry to an MCP server. Pass `registerTool` when the server's
 * `registerTool` is itself wrapped (as in the executable entry), so binding
 * reaches the SDK's original method rather than recursing through the wrapper.
 */
export function bindMcp(
  server: McpServerLike,
  registry: ToolRegistry,
  registerTool?: McpServerLike["registerTool"],
): void {
  const register = (registerTool ?? server.registerTool).bind(server);
  registry.bind((tool) => register(tool.name, tool.config, tool.handler));
}
