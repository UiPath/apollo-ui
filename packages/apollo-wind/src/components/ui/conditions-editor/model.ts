import type { ValueMode } from '@/components/ui/field-addons';
import type { MatchMode } from '@/components/ui/row-groups';

/** The value modes a condition can offer. A prompt is not a comparable value. */
export type ConditionValueMode = Exclude<ValueMode, 'prompt'>;

/** One field / operator / value row. Every part is optional while the row is being filled in. */
export interface Condition {
  kind: 'condition';
  id: string;
  /** The compared field's `value`. */
  field?: string;
  /** The operator's `value`. */
  operator?: string;
  /** Text, a number as typed, an ISO date, an option value, an expression, or a variable reference. */
  value?: string;
  /** The chosen option values, for an operator that takes several. */
  values?: string[];
  /** Omitted means Fixed value. */
  valueMode?: ConditionValueMode;
}

export interface ConditionGroup {
  kind: 'group';
  id: string;
  mode: MatchMode;
  children: ConditionNode[];
}

export type ConditionNode = Condition | ConditionGroup;

// Random, so a new row never reuses the id of one saved in an earlier session.
function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createCondition(
  init: Omit<Condition, 'kind' | 'id'> & { id?: string } = {}
): Condition {
  return { kind: 'condition', id: init.id ?? newId('condition'), ...init };
}

export function createConditionGroup(
  mode: MatchMode = 'all',
  children: ConditionNode[] = [],
  id = newId('group')
): ConditionGroup {
  return { kind: 'group', id, mode, children };
}

/** Replaces the node with `id`. Groups off its path keep their identity, so memoised rows stay put. */
export function updateNode(
  root: ConditionGroup,
  id: string,
  update: (node: ConditionNode) => ConditionNode
): ConditionGroup {
  if (root.id === id) return update(root) as ConditionGroup;
  let changed = false;
  const children = root.children.map((child) => {
    const next =
      child.id === id
        ? update(child)
        : child.kind === 'group'
          ? updateNode(child, id, update)
          : child;
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...root, children } : root;
}

export function removeNode(root: ConditionGroup, id: string): ConditionGroup {
  let changed = false;
  const children: ConditionNode[] = [];
  for (const child of root.children) {
    if (child.id === id) {
      changed = true;
      continue;
    }
    const next = child.kind === 'group' ? removeNode(child, id) : child;
    if (next !== child) changed = true;
    children.push(next);
  }
  return changed ? { ...root, children } : root;
}

export function countConditions(node: ConditionGroup): number {
  return node.children.reduce(
    (total, child) => total + (child.kind === 'condition' ? 1 : countConditions(child)),
    0
  );
}

/** Each condition's 1-based position across the tree, in reading order, so names match the screen. */
export function numberConditions(node: ConditionGroup, map = new Map<string, number>()) {
  for (const child of node.children) {
    if (child.kind === 'condition') map.set(child.id, map.size + 1);
    else numberConditions(child, map);
  }
  return map;
}

/** Each nested group's 1-based position across the tree, in reading order, so their names differ. */
export function numberGroups(node: ConditionGroup, map = new Map<string, number>()) {
  for (const child of node.children) {
    if (child.kind === 'group') {
      map.set(child.id, map.size + 1);
      numberGroups(child, map);
    }
  }
  return map;
}

export function collectIds(node: ConditionGroup, ids = new Set<string>()) {
  for (const child of node.children) {
    ids.add(child.id);
    if (child.kind === 'group') collectIds(child, ids);
  }
  return ids;
}
