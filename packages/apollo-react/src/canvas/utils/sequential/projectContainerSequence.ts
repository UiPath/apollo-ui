import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { filterGraphByNodes, indexNodesByParent } from './graph-helpers';
import { layoutSequence } from './layoutSequence';
import { defaultIsSequenceNode } from './predicates';
import { projectionWithPreviewRow } from './previewRow';
import { projectSequence } from './projectSequence';
import type {
  InsertionSlot,
  LayoutSequenceOptions,
  ProjectSequenceOptions,
  SequenceLayout,
  SequenceProjection,
} from './sequential.types';

export interface ContainerSequenceOptions extends ProjectSequenceOptions {
  /** Which descendants take part; defaults to everything but sticky notes. */
  isSequenceNode?: (node: Node) => boolean;
  layoutOptions?: LayoutSequenceOptions;
  /** Active insert slot: the layout opens a one-row gap with a preview row at that slot. */
  insertSlot?: InsertionSlot;
}

/** Why a container cannot be shown as a sequence. */
export type ContainerSequenceBlocker = 'missing-container';

export interface ContainerSequence {
  containerId: string;
  /** Canonical ids of every descendant that took part, at any depth. */
  childIds: ReadonlySet<string>;
  projection: SequenceProjection;
  /** Positions and waypoints in the container's local space, origin at (0, 0). */
  layout: SequenceLayout;
}

/**
 * Returns the reason a container's body cannot be projected as a sequence, or undefined
 * when it can. Nested containers are fine: they project as indented container bodies.
 */
export function canSequenceContainer(
  nodes: readonly Node[],
  containerId: string
): ContainerSequenceBlocker | undefined {
  return nodes.some((node) => node.id === containerId) ? undefined : 'missing-container';
}

/**
 * Ids of the container's descendants at any depth, descending only through nodes that pass
 * `keep`, so an excluded node takes its subtree with it. Cycle-safe.
 */
function collectDescendantIds(
  nodes: readonly Node[],
  containerId: string,
  keep: (node: Node) => boolean
): Set<string> {
  const { childrenByParent } = indexNodesByParent(nodes);
  const ids = new Set<string>();
  const stack = [containerId];
  while (stack.length > 0) {
    const parentId = stack.pop()!;
    for (const child of childrenByParent.get(parentId) ?? []) {
      if (ids.has(child.id) || child.id === containerId || !keep(child)) continue;
      ids.add(child.id);
      stack.push(child.id);
    }
  }
  return ids;
}

/**
 * Projects ONE container's body as a sequence, scoped to its descendants. Direct children
 * are detached from the container (so the body's first step is a root, not a nested lane);
 * deeper descendants keep their `parentId`, so a nested container walks as an indented
 * body. The container's own entry and exit edges fall outside the scope. Slots with no
 * container of their own are stamped with `containerId`, so an insert parents correctly:
 * into the runtime container at the top level, into the nested container inside its body.
 */
export function projectContainerSequence(
  nodes: readonly Node[],
  edges: readonly Edge[],
  containerId: string,
  options: ContainerSequenceOptions = {}
): ContainerSequence | undefined {
  if (canSequenceContainer(nodes, containerId)) return undefined;
  const isSequenceNode = options.isSequenceNode ?? defaultIsSequenceNode;
  const descendantIds = collectDescendantIds(nodes, containerId, isSequenceNode);
  const scoped = filterGraphByNodes(nodes, edges, (node) => descendantIds.has(node.id));
  const detached = scoped.nodes.map((node) =>
    node.parentId === containerId ? { ...node, parentId: undefined, extent: undefined } : node
  );

  let projection = projectSequence(detached, scoped.edges, {
    isSequenceEdge: options.isSequenceEdge,
    isContainerNode: options.isContainerNode,
    resolveBranchLabel: options.resolveBranchLabel,
    getBranchHandles: options.getBranchHandles,
    collapsedStepIds: options.collapsedStepIds,
    isStartNode: options.isStartNode ?? (() => false),
  });
  // The projection is freshly built, so stamping its own slot objects is safe.
  for (const slot of projection.slots) {
    if (slot.containerId === undefined) slot.containerId = containerId;
  }
  if (options.insertSlot) {
    projection = projectionWithPreviewRow(projection, options.insertSlot);
  }

  return {
    containerId,
    childIds: scoped.nodeIds,
    projection,
    layout: layoutSequence(projection, options.layoutOptions),
  };
}
