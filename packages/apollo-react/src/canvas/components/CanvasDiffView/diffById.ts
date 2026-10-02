import type { ChangeKind, DiffHighlight, DiffSummary } from './CanvasDiffView.types';

export interface DiffByIdOptions<Doc, Node, Edge> {
  getNodes(doc: Doc): readonly Node[];
  getEdges(doc: Doc): readonly Edge[];
  /** @default (node) => node.id */
  nodeId?(node: Node): string;
  /** @default (edge) => edge.id */
  edgeId?(edge: Edge): string;
  /**
   * Node keys excluded from comparison, so layout moves don't read as changes.
   * Dotted paths reach into nested objects, e.g. `['position', 'data.ui']`.
   */
  ignoreNodeKeys?: string[];
  /** Edge keys excluded from comparison. Same path syntax as `ignoreNodeKeys`. */
  ignoreEdgeKeys?: string[];
}

export interface DiffByIdResult {
  highlight: DiffHighlight;
  summary: DiffSummary;
}

/** Sorted-key JSON so key order never reads as a change. Honours `toJSON` (e.g. `Date`). */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
    return stableStringify((value as { toJSON(): unknown }).toJSON());
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

function omitPath(value: unknown, path: string[]): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value) || path.length === 0) {
    return value;
  }
  const [head, ...rest] = path as [string, ...string[]];
  if (!(head in value)) return value;
  const { [head]: child, ...others } = value as Record<string, unknown>;
  return rest.length === 0 ? others : { ...others, [head]: omitPath(child, rest) };
}

function fingerprint(value: unknown, ignorePaths: string[][]): string {
  return stableStringify(ignorePaths.reduce(omitPath, value));
}

const defaultId = (element: unknown): string => String((element as { id: unknown }).id);

function diffCollection<T>(
  before: readonly T[],
  after: readonly T[],
  getId: (element: T) => string,
  ignoreKeys: string[] | undefined
): { kinds: Map<string, ChangeKind>; added: number; removed: number; changed: number } {
  const ignorePaths = (ignoreKeys ?? []).map((key) => key.split('.'));
  const beforeById = new Map(before.map((el) => [getId(el), fingerprint(el, ignorePaths)]));
  const afterIds = new Set<string>();
  const kinds = new Map<string, ChangeKind>();
  let added = 0;
  let removed = 0;
  let changed = 0;

  for (const element of after) {
    const id = getId(element);
    afterIds.add(id);
    const previous = beforeById.get(id);
    if (previous === undefined) {
      kinds.set(id, 'added');
      added++;
    } else if (previous !== fingerprint(element, ignorePaths)) {
      kinds.set(id, 'changed');
      changed++;
    }
  }
  for (const id of beforeById.keys()) {
    if (!afterIds.has(id)) {
      kinds.set(id, 'removed');
      removed++;
    }
  }
  return { kinds, added, removed, changed };
}

/**
 * Id-keyed diff of two documents. Elements present only in `after` are added,
 * only in `before` removed, and in both with different content (by stable
 * stringify, minus the ignored keys) changed.
 */
export function diffById<Doc, Node, Edge>(
  before: Doc,
  after: Doc,
  options: DiffByIdOptions<Doc, Node, Edge>
): DiffByIdResult {
  const { getNodes, getEdges, nodeId = defaultId, edgeId = defaultId } = options;
  const nodes = diffCollection(getNodes(before), getNodes(after), nodeId, options.ignoreNodeKeys);
  const edges = diffCollection(getEdges(before), getEdges(after), edgeId, options.ignoreEdgeKeys);

  return {
    highlight: { nodeKind: nodes.kinds, edgeKind: edges.kinds },
    summary: {
      addedNodes: nodes.added,
      removedNodes: nodes.removed,
      changedNodes: nodes.changed,
      addedEdges: edges.added,
      removedEdges: edges.removed,
      changedEdges: edges.changed,
    },
  };
}
