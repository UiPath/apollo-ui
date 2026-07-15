import type {
  JsonContainer,
  JsonObject,
  JsonSchema,
  JsonSchemaTypeName,
  JsonTreeNode,
  JsonTreeNodeType,
  JsonValue,
  PathSegment,
} from './JsonTree.types';

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Appends a segment to an expression path (`a.b`, `a["x-y"]`, `a[0]`). */
export function appendPathSegment(path: string, segment: PathSegment): string {
  if (typeof segment === 'number') return `${path}[${segment}]`;
  if (IDENTIFIER_RE.test(segment)) return path ? `${path}.${segment}` : segment;
  return `${path}[${JSON.stringify(segment)}]`;
}

export function inferValueType(value: JsonValue): JsonTreeNodeType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'object';
  }
}

function declaredTypes(schema: JsonSchema | undefined): JsonSchemaTypeName[] | undefined {
  if (!schema?.type) return undefined;
  return Array.isArray(schema.type) ? schema.type : [schema.type];
}

/** The type a schema-only (unset) node should display as. */
export function schemaDisplayType(schema: JsonSchema | undefined): JsonTreeNodeType {
  const types = declaredTypes(schema);
  const first = types?.find((t) => t !== 'null') ?? types?.[0];
  if (first) return first === 'integer' ? 'number' : first;
  if (schema?.properties) return 'object';
  if (schema?.items) return 'array';
  const enumSample = schema?.enum?.find((v) => v !== null);
  if (enumSample !== undefined) return inferValueType(enumSample);
  return 'null';
}

interface BuildNodeInput {
  key: string;
  segments: PathSegment[];
  path: string;
  schema?: JsonSchema;
  value?: JsonValue;
  hasValue: boolean;
  required?: boolean;
  /** Node belongs to a schema-only array-item preview (see `isArrayItemTemplate`). */
  isTemplate?: boolean;
}

function buildNode(input: BuildNodeInput): JsonTreeNode {
  const type = input.hasValue
    ? inferValueType(input.value as JsonValue)
    : schemaDisplayType(input.schema);

  const node: JsonTreeNode = {
    key: input.key,
    path: input.path,
    segments: input.segments,
    type,
    required: input.required,
    schema: input.schema,
  };
  if (input.hasValue) node.value = input.value;
  if (input.isTemplate) node.isArrayItemTemplate = true;

  if (type === 'object') {
    node.children = buildObjectChildren(
      input.hasValue ? (input.value as JsonObject) : undefined,
      input.schema,
      input.segments,
      input.path,
      input.isTemplate
    );
  } else if (type === 'array') {
    node.children = buildArrayChildren(
      input.schema,
      input.value,
      input.hasValue,
      input.segments,
      input.path,
      input.isTemplate
    );
  }

  return node;
}

/**
 * Children for an array node. Real items map one-to-one to child nodes. When
 * there are no items but the schema declares `items`, synthesize a single
 * read-only preview child so the expected item shape stays visible from the
 * schema alone. This applies to both schema-only (value-less) arrays and
 * present-but-empty ones. The preview subtree is flagged `isArrayItemTemplate`
 * throughout via `isTemplate`.
 */
function buildArrayChildren(
  schema: JsonSchema | undefined,
  value: JsonValue | undefined,
  hasValue: boolean,
  segments: PathSegment[],
  path: string,
  isTemplate?: boolean
): JsonTreeNode[] {
  const items = hasValue && Array.isArray(value) ? value : [];
  if (items.length > 0) {
    return items.map((item, index) =>
      buildNode({
        key: String(index),
        segments: [...segments, index],
        path: appendPathSegment(path, index),
        schema: schema?.items,
        value: item,
        hasValue: true,
        isTemplate,
      })
    );
  }
  if (schema?.items) {
    return [
      buildNode({
        key: '0',
        segments: [...segments, 0],
        path: appendPathSegment(path, 0),
        schema: schema.items,
        hasValue: false,
        isTemplate: true,
      }),
    ];
  }
  return [];
}

function buildObjectChildren(
  value: JsonObject | undefined,
  schema: JsonSchema | undefined,
  segments: PathSegment[],
  path: string,
  isTemplate?: boolean
): JsonTreeNode[] {
  const properties = schema?.properties ?? {};
  const required = new Set(schema?.required ?? []);
  const additional =
    typeof schema?.additionalProperties === 'object' ? schema.additionalProperties : undefined;

  const children: JsonTreeNode[] = [];

  // Schema-declared keys first (in schema order), present or not. Own-property
  // checks throughout so keys named after Object.prototype members
  // (`constructor`, `toString`, `__proto__`, …) are treated as real data.
  for (const [key, childSchema] of Object.entries(properties)) {
    const hasValue = value !== undefined && Object.hasOwn(value, key);
    children.push(
      buildNode({
        key,
        segments: [...segments, key],
        path: appendPathSegment(path, key),
        schema: childSchema,
        value: hasValue ? value?.[key] : undefined,
        hasValue,
        required: required.has(key),
        isTemplate,
      })
    );
  }

  // Then value keys the schema does not declare. When `additionalProperties`
  // is itself a schema it describes those keys (descriptions, enum editing).
  if (value !== undefined) {
    for (const [key, childValue] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) continue;
      children.push(
        buildNode({
          key,
          segments: [...segments, key],
          path: appendPathSegment(path, key),
          schema: additional,
          value: childValue,
          hasValue: true,
        })
      );
    }
  }

  return children;
}

export interface BuildJsonTreeOptions {
  schema?: JsonSchema;
  /** Root value to render. Must be an object or array (fields of a container). */
  value?: JsonContainer;
  /** Prefix prepended to every path (e.g. a node id). Default: none. */
  basePath?: string;
}

/**
 * Merges a JSON Schema with a JSON value into a tree.
 *
 * Returns the children of the root: schema-declared entries first (rendered
 * even when the value omits them, as "unset"), then value entries the schema
 * does not declare. Without a schema the tree is value-driven.
 */
export function buildJsonTree(options: BuildJsonTreeOptions): JsonTreeNode[] {
  const { schema, value, basePath = '' } = options;

  // The runtime value decides the root shape whenever one exists; the schema is
  // only consulted when the value is absent. Otherwise a stale array schema
  // would hide an object value (and vice versa).
  const rootIsArray =
    value !== undefined ? Array.isArray(value) : !!schema && schemaDisplayType(schema) === 'array';

  if (rootIsArray) {
    return buildArrayChildren(schema, value, value !== undefined, [], basePath);
  }

  return buildObjectChildren(isJsonObject(value) ? value : undefined, schema, [], basePath);
}

/**
 * True for the synthesized array-item preview node itself (the "item" row), as
 * opposed to its descendant fields. Only array elements carry a numeric final
 * segment, and a preview subtree has no real elements, so a numeric tail marks
 * the preview item at any nesting depth. Used to label the row and to keep it
 * out of the parent array's item count.
 */
export function isArrayItemTemplateRoot(node: JsonTreeNode): boolean {
  return !!node.isArrayItemTemplate && typeof node.segments[node.segments.length - 1] === 'number';
}

export interface FlatJsonTreeRow {
  node: JsonTreeNode;
  depth: number;
}

/** Consumer display texts for a node, so search can match them alongside the raw key. */
export type NodeDisplayTexts = (
  node: JsonTreeNode
) => { label?: string; sublabel?: string } | undefined;

function nodeSelfMatchesQuery(
  node: JsonTreeNode,
  query: string,
  displayTexts?: NodeDisplayTexts
): boolean {
  if (node.key.toLowerCase().includes(query)) return true;
  const display = displayTexts?.(node);
  if (display?.label?.toLowerCase().includes(query)) return true;
  if (display?.sublabel?.toLowerCase().includes(query)) return true;
  return (
    node.value !== undefined &&
    node.value !== null &&
    typeof node.value !== 'object' &&
    String(node.value).toLowerCase().includes(query)
  );
}

function nodeMatchesQuery(
  node: JsonTreeNode,
  query: string,
  displayTexts?: NodeDisplayTexts
): boolean {
  if (nodeSelfMatchesQuery(node, query, displayTexts)) return true;
  return node.children?.some((c) => nodeMatchesQuery(c, query, displayTexts)) ?? false;
}

function nodeOrDescendantMatches(
  node: JsonTreeNode,
  predicate: (node: JsonTreeNode) => boolean
): boolean {
  if (predicate(node)) return true;
  return node.children?.some((c) => nodeOrDescendantMatches(c, predicate)) ?? false;
}

export interface FlattenOptions {
  collapsed?: Record<string, boolean>;
  query?: string;
  /**
   * Rows are kept when the node (or any descendant) matches; a node that
   * matches directly shows its whole subtree.
   */
  filterPredicate?: (node: JsonTreeNode) => boolean;
  /** Lets search also match consumer display labels (e.g. decoration labels). */
  displayTexts?: NodeDisplayTexts;
}

/** Flattens the tree to visible rows, honoring collapse state, search, and filter. */
export function flattenJsonTree(
  nodes: JsonTreeNode[],
  options: FlattenOptions = {},
  depth = 0
): FlatJsonTreeRow[] {
  const { collapsed = {}, filterPredicate } = options;
  const query = options.query?.trim().toLowerCase() ?? '';
  const rows: FlatJsonTreeRow[] = [];

  for (const node of nodes) {
    const selfQueryMatch = !!query && nodeSelfMatchesQuery(node, query, options.displayTexts);
    if (
      query &&
      !selfQueryMatch &&
      !(node.children?.some((c) => nodeMatchesQuery(c, query, options.displayTexts)) ?? false)
    ) {
      continue;
    }
    const selfPredicateMatch = !!filterPredicate && filterPredicate(node);
    if (
      filterPredicate &&
      !selfPredicateMatch &&
      !(node.children?.some((c) => nodeOrDescendantMatches(c, filterPredicate)) ?? false)
    ) {
      continue;
    }
    rows.push({ node, depth });
    if (node.children && !collapsed[node.path]) {
      // A node that matches the query or filter itself shows its whole
      // subtree; descendant-driven matches keep filtering the children.
      const childOptions =
        selfQueryMatch || selfPredicateMatch
          ? {
              ...options,
              query: selfQueryMatch ? '' : options.query,
              filterPredicate: selfPredicateMatch ? undefined : filterPredicate,
            }
          : options;
      rows.push(...flattenJsonTree(node.children, childOptions, depth + 1));
    }
  }
  return rows;
}

export interface ContainerPath {
  path: string;
  depth: number;
}

/** All container (object/array) paths in the tree, with their depth. */
export function collectContainerPaths(nodes: JsonTreeNode[], depth = 0): ContainerPath[] {
  const paths: ContainerPath[] = [];
  for (const node of nodes) {
    if (node.children) {
      paths.push({ path: node.path, depth });
      paths.push(...collectContainerPaths(node.children, depth + 1));
    }
  }
  return paths;
}

export function getValueAtPath(
  root: JsonValue | undefined,
  segments: PathSegment[]
): JsonValue | undefined {
  let current: JsonValue | undefined = root;
  for (const segment of segments) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
    } else {
      // Own-property read: `current['__proto__']` would otherwise return the
      // prototype rather than a data value.
      if (!isJsonObject(current) || !Object.hasOwn(current, segment)) return undefined;
      current = current[segment];
    }
  }
  return current;
}

/**
 * Returns a copy of `root` with `value` set at `segments`, creating missing
 * containers along the way (arrays for numeric segments, objects otherwise).
 * This is how edits on schema-declared but absent branches extend the value.
 */
export function setValueAtPath(
  root: JsonValue | undefined,
  segments: PathSegment[],
  value: JsonValue
): JsonValue {
  const [head, ...rest] = segments;
  if (head === undefined) return value;
  if (typeof head === 'number') {
    const array = Array.isArray(root) ? [...root] : [];
    array[head] = setValueAtPath(array[head], rest, value);
    return array;
  }
  const object: JsonObject = isJsonObject(root) ? { ...root } : {};
  // Define the property rather than assign it: `object['__proto__'] = …` hits
  // the prototype setter (dropping the data / mutating the prototype), while a
  // data-property definition stores an own, JSON-serializable value for any key.
  const previous = Object.hasOwn(object, head) ? object[head] : undefined;
  Object.defineProperty(object, head, {
    value: setValueAtPath(previous, rest, value),
    enumerable: true,
    configurable: true,
    writable: true,
  });
  return object;
}

/**
 * Returns a copy of `root` with the entry at `segments` removed (object keys
 * are deleted, array items spliced out). Removing the root itself (`segments`
 * empty) returns undefined. Paths that don't resolve return `root` unchanged.
 */
export function removeValueAtPath(
  root: JsonValue | undefined,
  segments: PathSegment[]
): JsonValue | undefined {
  const [head, ...rest] = segments;
  if (head === undefined) return undefined;
  if (typeof head === 'number') {
    if (!Array.isArray(root) || head >= root.length) return root;
    if (rest.length === 0) {
      const array = [...root];
      array.splice(head, 1);
      return array;
    }
    const child = removeValueAtPath(root[head], rest) as JsonValue;
    if (child === root[head]) return root;
    const array = [...root];
    array[head] = child;
    return array;
  }
  if (!isJsonObject(root) || !Object.hasOwn(root, head)) return root;
  if (rest.length === 0) {
    const object = { ...root };
    delete object[head];
    return object;
  }
  const child = removeValueAtPath(root[head], rest) as JsonValue;
  if (child === root[head]) return root;
  return { ...root, [head]: child };
}

/** Formats a leaf value for display (`"text"`, `42`, `true`, `null`). */
export function formatLeafValue(type: JsonTreeNodeType, value: JsonValue | undefined): string {
  if (value === undefined || value === null) return 'null';
  if (type === 'string') return JSON.stringify(value);
  return String(value);
}
