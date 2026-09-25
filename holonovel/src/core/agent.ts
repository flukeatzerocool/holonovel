// Durable Agent Tasks — a persistent task and action lifecycle for NPCs and
// entities, with an autonomy policy. Tasks are durable Novel state; only
// admitted lifecycle transitions are permitted.
// REQ-522, REQ-523, REQ-524, REQ-525, REQ-526, REQ-527, REQ-528, REQ-529, REQ-530

export type AgentTaskStatus = "queued" | "active" | "done" | "failed" | "cancelled";
export type AgentAutonomy = "advisory" | "prompt" | "auto";

export interface AgentAction {
  seq: number;
  description: string;
  at: string;
}

export interface AgentTask {
  id: string;
  subject: string;
  goal: string;
  status: AgentTaskStatus;
  autonomy: AgentAutonomy;
  actions: AgentAction[];
  source_goal?: string;
  created_at: string;
  updated_at: string;
}

export const AUTONOMY_LEVELS: AgentAutonomy[] = ["advisory", "prompt", "auto"];

// REQ-524 — only these lifecycle transitions are permitted.
const TRANSITIONS: Record<AgentTaskStatus, AgentTaskStatus[]> = {
  queued: ["active", "cancelled"],
  active: ["done", "failed", "cancelled"],
  done: [],
  failed: [],
  cancelled: [],
};

export function isTerminal(status: AgentTaskStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function canTransition(from: AgentTaskStatus, to: AgentTaskStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

// REQ-522/REQ-523/REQ-524 — apply a lifecycle transition; returns false if illegal.
export function transition(task: AgentTask, to: AgentTaskStatus, at: string): boolean {
  if (!canTransition(task.status, to)) return false;
  task.status = to;
  task.updated_at = at;
  return true;
}

// REQ-525 — append an action to the task's log.
export function recordAction(task: AgentTask, description: string, at: string): AgentAction {
  const action: AgentAction = { seq: task.actions.length + 1, description, at };
  task.actions.push(action);
  task.updated_at = at;
  return action;
}

export function nextTaskId(tasks: AgentTask[]): string {
  let max = 0;
  for (const t of tasks) {
    const m = t.id.match(/^task-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `task-${max + 1}`;
}

// REQ-528 — a terminal task is immutable; only actions may still be appended.
export function isMutable(task: AgentTask): boolean {
  return !isTerminal(task.status);
}
