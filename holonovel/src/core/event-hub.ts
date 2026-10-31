// Event hub — per-consumer subscription state for server-to-client event
// echoes (REQ-433). Each adapter (MCP notification channel, in-process engine
// façade) owns its own topic set, so one consumer subscribing, unsubscribing,
// or closing cannot clear another's subscriptions.
//
// Pure: no transport, no engine state. The caller supplies a sink per consumer.

export type EventSink = (topic: string, payload: Record<string, unknown>) => void;

interface Consumer {
  topics: Set<string>;
  sink: EventSink;
}

export class EventHub {
  private readonly consumers = new Map<string, Consumer>();

  /** Add or replace a consumer. An empty topic set receives nothing. */
  add(id: string, topics: Iterable<string>, sink: EventSink): void {
    this.consumers.set(id, { topics: new Set(topics), sink });
  }

  /** Replace one consumer's topic set; no-op for an unknown consumer. */
  subscribe(id: string, topics: Iterable<string>): void {
    const consumer = this.consumers.get(id);
    if (!consumer) return;
    consumer.topics = new Set(topics);
  }

  /** Drop the listed topics, or every topic when none are listed. */
  unsubscribe(id: string, topics?: Iterable<string>): void {
    const consumer = this.consumers.get(id);
    if (!consumer) return;
    if (!topics) {
      consumer.topics.clear();
      return;
    }
    for (const topic of topics) consumer.topics.delete(topic);
  }

  /** Remove a consumer entirely (engine close, connection close). */
  remove(id: string): void {
    this.consumers.delete(id);
  }

  /** Deliver to every consumer subscribed to `topic`; sink errors are isolated. */
  dispatch(topic: string, payload: Record<string, unknown>): void {
    for (const consumer of this.consumers.values()) {
      if (!consumer.topics.has(topic)) continue;
      try {
        consumer.sink(topic, payload);
      } catch {
        // A consumer error never affects a tool result or another consumer.
      }
    }
  }

  /** Test/inspection surface: the topics a consumer currently holds. */
  topicsFor(id: string): string[] {
    return [...(this.consumers.get(id)?.topics ?? [])];
  }
}
