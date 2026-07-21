import type { Edge, Node, XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../constants';
import { getContainerFitGeometry, getNodeDimensions, type NodeDimensions } from './container';

export interface WorkflowLayoutOptions {
  /** Distance between dependency ranks. */
  rankGap?: number;
  /** Vertical distance between nodes in the same rank. */
  nodeGap?: number;
  /** Top-left origin for the root scope. */
  origin?: XYPosition;
  /** Identifies empty containers; containers with children are inferred automatically. */
  isContainerNode?: (node: Node) => boolean;
  /** Excludes presentation-only nodes while preserving their canonical positions. */
  isLayoutNode?: (node: Node) => boolean;
  /** Excludes presentation-only edges and loop-closing edges from rank calculation. */
  isLayoutEdge?: (edge: Edge) => boolean;
  /** Overrides measured node dimensions. */
  getNodeDimensions?: (node: Node) => NodeDimensions;
}

export interface WorkflowLayoutBounds extends XYPosition, NodeDimensions {}

/**
 * A complete, immutable left-to-right presentation of the canonical workflow.
 * Positions remain relative to `parentId`, matching XYFlow's node contract.
 */
export interface WorkflowLayoutResult {
  positions: ReadonlyMap<string, XYPosition>;
  dimensions: ReadonlyMap<string, NodeDimensions>;
  /** Nodes whose outer dimensions must be applied with the layout (containers only). */
  resizedNodeIds: ReadonlySet<string>;
  bounds: WorkflowLayoutBounds;
}

interface ScopeLayout {
  width: number;
  height: number;
}

interface LayoutItem {
  node: Node;
  size: NodeDimensions;
  stableIndex: number;
}

const DEFAULT_RANK_GAP = GRID_SPACING * 5;
const DEFAULT_NODE_GAP = GRID_SPACING * 3;

/**
 * Computes a deterministic left-to-right layout without changing graph data.
 *
 * Each containment scope is laid out independently. Nested scopes are resolved
 * inside-out so a container's calculated footprint participates in its parent's
 * rank spacing. Strongly connected components share a rank, which means cyclic
 * graphs remain finite and deterministic rather than hanging an auto-layout pass.
 */
export function layoutWorkflowLeftToRight(
  nodes: Node[],
  edges: Edge[],
  options: WorkflowLayoutOptions = {}
): WorkflowLayoutResult {
  const rankGap = options.rankGap ?? DEFAULT_RANK_GAP;
  const nodeGap = options.nodeGap ?? DEFAULT_NODE_GAP;
  const rootOrigin = options.origin ?? { x: 0, y: 0 };
  const shouldLayoutNode = options.isLayoutNode ?? (() => true);
  const shouldLayoutEdge =
    options.isLayoutEdge ?? ((edge: Edge) => edge.targetHandle !== 'loopBack');
  const resolveDimensions = options.getNodeDimensions ?? getNodeDimensions;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const positions = new Map<string, XYPosition>();
  const dimensions = new Map<string, NodeDimensions>();
  const resizedNodeIds = new Set<string>();
  const childrenByParent = new Map<string | undefined, Node[]>();

  for (const node of nodes) {
    const parentId = node.parentId && nodeById.has(node.parentId) ? node.parentId : undefined;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(parentId, siblings);
  }

  const isContainer = (node: Node) =>
    (childrenByParent.get(node.id)?.length ?? 0) > 0 || options.isContainerNode?.(node) === true;

  const layoutScope = (parentId: string | undefined): ScopeLayout => {
    const directChildren = (childrenByParent.get(parentId) ?? []).filter(shouldLayoutNode);
    const items: LayoutItem[] = directChildren.map((node, stableIndex) => {
      let size = resolveDimensions(node);
      const nestedChildren = childrenByParent.get(node.id)?.filter(shouldLayoutNode) ?? [];

      if (isContainer(node)) {
        resizedNodeIds.add(node.id);
        const nested = layoutScope(node.id);
        const fit = getContainerFitGeometry();
        const padding = fit.padding ?? {};
        const left = padding.left ?? 0;
        const top = padding.top ?? 0;
        const requiredWidth = left + nested.width + (padding.right ?? 0);
        const requiredHeight = top + nested.height + (padding.bottom ?? 0);
        size = {
          width: Math.max(size.width, fit.minWidth, requiredWidth),
          height: Math.max(size.height, fit.minHeight, requiredHeight),
        };

        if (nestedChildren.length > 0) {
          for (const child of nestedChildren) {
            const childPosition = positions.get(child.id);
            if (childPosition) {
              positions.set(child.id, {
                x: childPosition.x + left,
                y: childPosition.y + top,
              });
            }
          }
        }
      }

      dimensions.set(node.id, size);
      return { node, size, stableIndex };
    });

    if (items.length === 0) return { width: 0, height: 0 };

    const itemById = new Map(items.map((item) => [item.node.id, item]));
    const scopedEdges = edges.filter(
      (edge) => shouldLayoutEdge(edge) && itemById.has(edge.source) && itemById.has(edge.target)
    );
    const ranks = assignRanks(items, scopedEdges);
    const itemsByRank = new Map<number, LayoutItem[]>();

    for (const item of items) {
      const rank = ranks.get(item.node.id) ?? 0;
      const rankItems = itemsByRank.get(rank) ?? [];
      rankItems.push(item);
      itemsByRank.set(rank, rankItems);
    }

    const sortedRanks = [...itemsByRank.keys()].sort((left, right) => left - right);
    let x = 0;
    let scopeWidth = 0;
    let scopeHeight = 0;

    for (const rank of sortedRanks) {
      const rankItems = itemsByRank.get(rank)!;
      rankItems.sort(compareStableItems);
      const columnWidth = Math.max(...rankItems.map((item) => item.size.width));
      const columnHeight =
        rankItems.reduce((total, item) => total + item.size.height, 0) +
        nodeGap * Math.max(0, rankItems.length - 1);
      let y = 0;

      for (const item of rankItems) {
        const topLeft = { x, y };
        positions.set(item.node.id, topLeftToNodePosition(topLeft, item.node, item.size));
        y += item.size.height + nodeGap;
      }

      scopeWidth = Math.max(scopeWidth, x + columnWidth);
      scopeHeight = Math.max(scopeHeight, columnHeight);
      x += columnWidth + rankGap;
    }

    return { width: scopeWidth, height: scopeHeight };
  };

  const rootBounds = layoutScope(undefined);
  if (rootOrigin.x !== 0 || rootOrigin.y !== 0) {
    for (const rootNode of childrenByParent.get(undefined) ?? []) {
      const position = positions.get(rootNode.id);
      if (position) {
        positions.set(rootNode.id, {
          x: position.x + rootOrigin.x,
          y: position.y + rootOrigin.y,
        });
      }
    }
  }

  return {
    positions,
    dimensions,
    resizedNodeIds,
    bounds: { ...rootOrigin, ...rootBounds },
  };
}

function compareStableItems(left: LayoutItem, right: LayoutItem): number {
  return (
    left.node.position.y - right.node.position.y ||
    left.node.position.x - right.node.position.x ||
    left.stableIndex - right.stableIndex ||
    left.node.id.localeCompare(right.node.id)
  );
}

function topLeftToNodePosition(topLeft: XYPosition, node: Node, size: NodeDimensions): XYPosition {
  const [originX = 0, originY = 0] = node.origin ?? [];
  return {
    x: topLeft.x + size.width * originX,
    y: topLeft.y + size.height * originY,
  };
}

/** Assigns longest-path ranks after collapsing strongly connected components. */
function assignRanks(items: LayoutItem[], edges: Edge[]): Map<string, number> {
  const ids = items.map((item) => item.node.id);
  const order = new Map(ids.map((id, index) => [id, index]));
  const outgoing = new Map(ids.map((id) => [id, [] as string[]]));

  for (const edge of edges) {
    if (edge.source !== edge.target && !outgoing.get(edge.source)!.includes(edge.target)) {
      outgoing.get(edge.source)!.push(edge.target);
    }
  }
  for (const targets of outgoing.values()) {
    targets.sort((left, right) => order.get(left)! - order.get(right)!);
  }

  const components = findStronglyConnectedComponents(ids, outgoing);
  const componentById = new Map<string, number>();
  components.forEach((component, componentIndex) => {
    for (const id of component) componentById.set(id, componentIndex);
  });

  const componentOutgoing = new Map<number, Set<number>>();
  const indegree = new Map<number, number>();
  components.forEach((_component, index) => {
    componentOutgoing.set(index, new Set());
    indegree.set(index, 0);
  });

  for (const [source, targets] of outgoing) {
    const sourceComponent = componentById.get(source)!;
    for (const target of targets) {
      const targetComponent = componentById.get(target)!;
      if (
        sourceComponent !== targetComponent &&
        !componentOutgoing.get(sourceComponent)!.has(targetComponent)
      ) {
        componentOutgoing.get(sourceComponent)!.add(targetComponent);
        indegree.set(targetComponent, indegree.get(targetComponent)! + 1);
      }
    }
  }

  const componentOrder = components.map((component) =>
    Math.min(...component.map((id) => order.get(id)!))
  );
  const ready = components
    .map((_component, index) => index)
    .filter((index) => indegree.get(index) === 0)
    .sort((left, right) => componentOrder[left]! - componentOrder[right]!);
  const componentRanks = new Map<number, number>();

  while (ready.length > 0) {
    const component = ready.shift()!;
    const rank = componentRanks.get(component) ?? 0;
    const targets = [...componentOutgoing.get(component)!].sort(
      (left, right) => componentOrder[left]! - componentOrder[right]!
    );

    for (const target of targets) {
      componentRanks.set(target, Math.max(componentRanks.get(target) ?? 0, rank + 1));
      indegree.set(target, indegree.get(target)! - 1);
      if (indegree.get(target) === 0) {
        ready.push(target);
        ready.sort((left, right) => componentOrder[left]! - componentOrder[right]!);
      }
    }
  }

  return new Map(ids.map((id) => [id, componentRanks.get(componentById.get(id)!) ?? 0]));
}

function findStronglyConnectedComponents(
  ids: string[],
  outgoing: ReadonlyMap<string, string[]>
): string[][] {
  let nextIndex = 0;
  const indexById = new Map<string, number>();
  const lowLinkById = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  const visit = (id: string) => {
    indexById.set(id, nextIndex);
    lowLinkById.set(id, nextIndex);
    nextIndex += 1;
    stack.push(id);
    onStack.add(id);

    for (const target of outgoing.get(id) ?? []) {
      if (!indexById.has(target)) {
        visit(target);
        lowLinkById.set(id, Math.min(lowLinkById.get(id)!, lowLinkById.get(target)!));
      } else if (onStack.has(target)) {
        lowLinkById.set(id, Math.min(lowLinkById.get(id)!, indexById.get(target)!));
      }
    }

    if (lowLinkById.get(id) !== indexById.get(id)) return;
    const component: string[] = [];
    let member: string;
    do {
      member = stack.pop()!;
      onStack.delete(member);
      component.push(member);
    } while (member !== id);
    components.push(component);
  };

  for (const id of ids) {
    if (!indexById.has(id)) visit(id);
  }

  return components;
}
