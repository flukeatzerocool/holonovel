#!/usr/bin/env npx tsx
// server-manifest.ts — pure JSON-Schema subset validator for the MCP registry
// server manifest (REQ-428). No filesystem, no network: the caller supplies the
// parsed manifest and the vendored schema.
//
// The vendored schema uses 24 keys (8 annotations, 2 containers, 14
// assertions). `unsupportedKeywords` reports any key outside those sets, so a
// schema refresh fails loudly instead of validating partially.
//
// No exit codes: library module.

export const ANNOTATION_KEYS = new Set([
  "$schema", "$id", "$comment", "title", "description", "example", "examples", "default",
]);

export const CONTAINER_KEYS = new Set(["definitions", "properties"]);

export const ASSERTION_KEYS = new Set([
  "$ref", "type", "required", "additionalProperties", "items", "enum", "const",
  "pattern", "format", "anyOf", "allOf", "not", "minLength", "maxLength",
]);

export interface ManifestValidation {
  ok: boolean;
  errors: string[];
}

type Json = unknown;

function isObject(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesOf(node: Record<string, Json>): Json[] {
  return Object.values(node);
}

/** Every key used in a schema position, excluding instance data. */
export function schemaKeywords(schema: Json): string[] {
  const found = new Set<string>();
  const walk = (node: Json): void => {
    if (!isObject(node)) return;
    for (const [key, value] of Object.entries(node)) {
      found.add(key);
      if (key === "properties" || key === "definitions" || key === "patternProperties") {
        if (isObject(value)) for (const child of valuesOf(value)) walk(child);
      } else if (key === "items" || key === "not" || key === "additionalProperties") {
        if (isObject(value)) walk(value);
      } else if (key === "anyOf" || key === "allOf" || key === "oneOf") {
        if (Array.isArray(value)) for (const child of value) walk(child);
      }
    }
  };
  walk(schema);
  return [...found].sort();
}

/** Keys the validator does not understand, so coverage cannot silently shrink. */
export function unsupportedKeywords(schema: Json): string[] {
  return schemaKeywords(schema).filter(
    (key) => !ANNOTATION_KEYS.has(key) && !CONTAINER_KEYS.has(key) && !ASSERTION_KEYS.has(key),
  );
}

function typeMatches(value: Json, type: string): boolean {
  switch (type) {
    case "object": return isObject(value);
    case "array": return Array.isArray(value);
    case "string": return typeof value === "string";
    case "number": return typeof value === "number";
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    default: return true;
  }
}

function resolveRef(ref: string, root: Json): Json {
  if (!ref.startsWith("#/")) throw new Error(`unsupported external $ref: ${ref}`);
  let node: Json = root;
  for (const segment of ref.slice(2).split("/")) {
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isObject(node) || !(key in node)) throw new Error(`unresolvable $ref: ${ref}`);
    node = node[key];
  }
  return node;
}

function deepEqual(a: Json, b: Json): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Validate `value` against `schema`. Returns every error with its JSON path so
 * a failure names the offending field.
 */
export function validateManifest(value: Json, schema: Json): ManifestValidation {
  const errors: string[] = [];
  const validate = (node: Json, target: Json, path: string): void => {
    if (!isObject(node)) return;
    if (typeof node.$ref === "string") {
      let resolved: Json;
      try {
        resolved = resolveRef(node.$ref, schema);
      } catch (error) {
        errors.push(`${path}: ${(error as Error).message}`);
        return;
      }
      validate(resolved, target, path);
      return;
    }

    if (node.type !== undefined) {
      const types = Array.isArray(node.type) ? node.type : [node.type];
      if (!types.some((type) => typeMatches(target, String(type)))) {
        errors.push(`${path}: expected ${types.join("|")}`);
        return;
      }
    }

    if (Array.isArray(node.enum) && !node.enum.some((option) => deepEqual(option, target))) {
      errors.push(`${path}: not one of ${JSON.stringify(node.enum)}`);
    }
    if ("const" in node && !deepEqual(node.const, target)) {
      errors.push(`${path}: expected ${JSON.stringify(node.const)}`);
    }
    if (typeof target === "string") {
      if (typeof node.minLength === "number" && target.length < node.minLength) {
        errors.push(`${path}: shorter than ${node.minLength}`);
      }
      if (typeof node.maxLength === "number" && target.length > node.maxLength) {
        errors.push(`${path}: longer than ${node.maxLength}`);
      }
      if (typeof node.pattern === "string" && !new RegExp(node.pattern).test(target)) {
        errors.push(`${path}: does not match ${node.pattern}`);
      }
      if (node.format === "uri") {
        try {
          new URL(target);
        } catch {
          errors.push(`${path}: not a URI`);
        }
      }
    }

    if (isObject(target)) {
      if (Array.isArray(node.required)) {
        for (const key of node.required) {
          if (!(String(key) in target)) errors.push(`${path}: missing required '${String(key)}'`);
        }
      }
      const properties = isObject(node.properties) ? node.properties : {};
      for (const [key, childSchema] of Object.entries(properties)) {
        if (key in target) validate(childSchema, target[key], `${path}.${key}`);
      }
      if (node.additionalProperties !== undefined) {
        const extra = Object.keys(target).filter((key) => !(key in properties));
        if (node.additionalProperties === false) {
          for (const key of extra) errors.push(`${path}: unexpected property '${key}'`);
        } else if (isObject(node.additionalProperties)) {
          for (const key of extra) validate(node.additionalProperties, target[key], `${path}.${key}`);
        }
      }
    }

    if (Array.isArray(target) && isObject(node.items)) {
      target.forEach((item, index) => validate(node.items, item, `${path}[${index}]`));
    }

    if (Array.isArray(node.allOf)) {
      for (const child of node.allOf) validate(child, target, path);
    }
    if (Array.isArray(node.anyOf)) {
      const attempts = node.anyOf.map((child) => {
        const inner: string[] = [];
        const saved = errors.length;
        validate(child, target, path);
        inner.push(...errors.splice(saved));
        return inner;
      });
      if (!attempts.some((inner) => inner.length === 0)) {
        errors.push(`${path}: matches none of anyOf (${attempts.map((a) => a[0]).join("; ")})`);
      }
    }
    if (isObject(node.not)) {
      const saved = errors.length;
      validate(node.not, target, path);
      const matched = errors.length === saved;
      errors.splice(saved);
      if (matched) errors.push(`${path}: matches a forbidden schema`);
    }
  };

  validate(schema, value, "$");
  return { ok: errors.length === 0, errors };
}
