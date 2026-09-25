// Knowledge-Graph Projection — a derived, rebuildable JSON graph over Novel
// sources. The Novel file is authoritative; the projection is read-only and
// never writes state.
// REQ-510, REQ-511, REQ-512, REQ-513, REQ-514

import { createHash } from "node:crypto";

export type GraphNodeType = "character" | "npc" | "lore" | "faction" | "room";
export type GraphEdgeType = "relates_to" | "located_in" | "holds_territory";
export type GraphScope = "shared" | "game_master";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  scope: GraphScope;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: GraphEdgeType;
  label?: string;
}

export interface KnowledgeGraph {
  built_at: string;
  fingerprint: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// REQ-510 — the projection reads a normalized source set, not the Novel directly.
export interface GraphSourceSet {
  characters: { id: string; name: string; current_room?: string | null }[];
  npcs: { id: string; name: string; location?: string | null; room_id?: string | null }[];
  lore: { key: string; scope: GraphScope }[];
  factions: { id: string; name: string; territory?: string[] }[];
  rooms: { id: string; name: string }[];
  relationships: { entity_a: string; entity_b: string; type: string }[];
}

const nodeId = {
  character: (id: string) => `character:${id}`,
  npc: (id: string) => `npc:${id}`,
  lore: (key: string) => `lore:${key}`,
  faction: (id: string) => `faction:${id}`,
  room: (id: string) => `room:${id}`,
};

// REQ-513 — a source fingerprint for staleness detection.
export function fingerprintGraph(sources: GraphSourceSet): string {
  const canonical = JSON.stringify({
    characters: sources.characters.map((c) => [c.id, c.name, c.current_room ?? null]).sort(),
    npcs: sources.npcs.map((n) => [n.id, n.name, n.room_id ?? n.location ?? null]).sort(),
    lore: sources.lore.map((l) => [l.key, l.scope]).sort(),
    factions: sources.factions.map((f) => [f.id, f.name, (f.territory ?? []).slice().sort()]).sort(),
    rooms: sources.rooms.map((r) => [r.id, r.name]).sort(),
    relationships: sources.relationships.map((r) => [r.entity_a, r.entity_b, r.type]).sort(),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

// REQ-510/REQ-511/REQ-512 — build a deterministic graph from the source set.
export function projectGraph(sources: GraphSourceSet, builtAt: string): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const roomIds = new Set(sources.rooms.map((r) => r.id));
  const characterIds = new Set(sources.characters.map((c) => c.id));

  for (const c of sources.characters) nodes.push({ id: nodeId.character(c.id), type: "character", label: c.name, scope: "shared" });
  for (const r of sources.rooms) nodes.push({ id: nodeId.room(r.id), type: "room", label: r.name, scope: "shared" });
  for (const n of sources.npcs) nodes.push({ id: nodeId.npc(n.id), type: "npc", label: n.name, scope: "game_master" });
  for (const l of sources.lore) nodes.push({ id: nodeId.lore(l.key), type: "lore", label: l.key, scope: l.scope });
  for (const f of sources.factions) nodes.push({ id: nodeId.faction(f.id), type: "faction", label: f.name, scope: "game_master" });

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = [];
  const pushEdge = (from: string, to: string, type: GraphEdgeType, label?: string) => {
    if (nodeIds.has(from) && nodeIds.has(to)) edges.push(label ? { from, to, type, label } : { from, to, type });
  };

  // REQ-512 — relationship edges.
  for (const rel of sources.relationships) {
    if (characterIds.has(rel.entity_a) && characterIds.has(rel.entity_b)) {
      pushEdge(nodeId.character(rel.entity_a), nodeId.character(rel.entity_b), "relates_to", rel.type);
    }
  }
  // REQ-512 — location edges.
  for (const c of sources.characters) {
    if (c.current_room && roomIds.has(c.current_room)) pushEdge(nodeId.character(c.id), nodeId.room(c.current_room), "located_in");
  }
  for (const n of sources.npcs) {
    const room = n.room_id ?? n.location;
    if (room && roomIds.has(room)) pushEdge(nodeId.npc(n.id), nodeId.room(room as string), "located_in");
  }
  // REQ-512 — faction territory edges.
  for (const f of sources.factions) {
    for (const room of f.territory ?? []) {
      if (roomIds.has(room)) pushEdge(nodeId.faction(f.id), nodeId.room(room), "holds_territory");
    }
  }

  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => `${a.from}|${a.to}|${a.type}|${a.label ?? ""}`.localeCompare(`${b.from}|${b.to}|${b.type}|${b.label ?? ""}`));
  return { built_at: builtAt, fingerprint: fingerprintGraph(sources), nodes, edges };
}

export function visibleGraph(graph: KnowledgeGraph, scopes: GraphScope[]): KnowledgeGraph {
  const allow = new Set(scopes);
  const visibleNodes = graph.nodes.filter((n) => allow.has(n.scope));
  const ids = new Set(visibleNodes.map((n) => n.id));
  return {
    ...graph,
    nodes: visibleNodes,
    edges: graph.edges.filter((e) => ids.has(e.from) && ids.has(e.to)),
  };
}
