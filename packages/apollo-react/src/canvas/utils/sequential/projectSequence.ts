import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  buildGraphIndex,
  defaultIsSequenceEdge,
  edgeDataLabel,
  entriesForScope,
  filterGraphByNodes,
  forwardOut,
  isBranchSource,
  isLoopBackEdge,
  isSequentialContinuationEdge,
  isContainerNode as isStructuralContainerNode,
  lanePlaceholderId,
  leafPlaceholderId,
  type Scope,
  sortByFlow,
  sourceHandleOf,
} from './graph-helpers';
import { findMerge } from './mergeAnalysis';
import { defaultIsStartNode } from './predicates';
import type {
  InsertionSlot,
  ProjectSequenceOptions,
  SequenceConnector,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';

const CONTAINER_START_LABEL = 'Body';
const CONTAINER_START_HANDLE = 'start';
const EMPTY_SCOPE: ReadonlySet<string> = new Set();

/**
 * Pure projection of the canonical graph into sequential rows, connectors and slots.
 * DFS pre-order from the entry set (flow-y ordered) numbers steps before collapse
 * filtering. Containers and branch nodes open indented lanes closed by a shared merge.
 * Malformed shapes degrade (multi-root stacks, unstructured merge/cycle become `goto`,
 * orphans trail) rather than fail.
 */
export function projectSequence(
  nodes: Node[],
  edges: Edge[],
  options?: ProjectSequenceOptions
): SequenceProjection {
  const isSequenceEdge = options?.isSequenceEdge ?? defaultIsSequenceEdge;
  const isStartNode = options?.isStartNode ?? defaultIsStartNode;
  const collapsedSet = options?.collapsedStepIds ?? EMPTY_SCOPE;
  const { nodes: sequenceNodes, edges: sequenceEdges } = filterGraphByNodes(
    nodes,
    edges,
    (node) => !isStartNode(node)
  );
  const index = buildGraphIndex(sequenceNodes, sequenceEdges, isSequenceEdge);

  const rows: SequenceRow[] = [];
  const rowByNodeId = new Map<string, SequenceRow>();
  const connectors: SequenceConnector[] = [];
  const slotsById = new Map<string, InsertionSlot>();
  const isContainer = (nodeId: string): boolean => {
    const node = index.nodesById.get(nodeId);
    return (
      isStructuralContainerNode(index, nodeId) ||
      (!!node && options?.isContainerNode?.(node) === true)
    );
  };
  const declaredBranchHandlesByNodeId = new Map<string, { id: string; label: string }[]>();
  const declaredBranchHandles = (nodeId: string): { id: string; label: string }[] => {
    if (isContainer(nodeId)) return [];
    const cached = declaredBranchHandlesByNodeId.get(nodeId);
    if (cached) return cached;
    const node = index.nodesById.get(nodeId);
    const handles = node ? (options?.getBranchHandles?.(node) ?? []) : [];
    declaredBranchHandlesByNodeId.set(nodeId, handles);
    return handles;
  };

  const visited = new Set<string>();
  const onStack = new Set<string>();
  let counter = 0;

  const addSlot = (slot: InsertionSlot): InsertionSlot => {
    const existing = slotsById.get(slot.id);
    if (existing) return existing;
    slotsById.set(slot.id, slot);
    return slot;
  };

  // Edges the walk placed; leftovers become gotos in the post-pass so none are dropped.
  const representedEdgeIds = new Set<string>();

  const slotFromEdge = (edge: Edge, containerId: Scope): InsertionSlot => {
    representedEdgeIds.add(edge.id);
    return addSlot({
      id: `slot:edge:${edge.id}`,
      source: { nodeId: edge.source, handleId: edge.sourceHandle ?? undefined },
      target: { nodeId: edge.target, handleId: edge.targetHandle ?? undefined },
      graphEdgeId: edge.id,
      containerId: containerId ?? undefined,
      continuation: isSequentialContinuationEdge(edge) || undefined,
    });
  };

  const pushGoto = (edge: Edge, sourceRowId: string, targetRowId: string): void => {
    representedEdgeIds.add(edge.id);
    connectors.push({ id: `conn:goto:${edge.id}`, kind: 'goto', sourceRowId, targetRowId });
  };

  const emitRow = (
    nodeId: string,
    depth: number,
    parentRowId: string | undefined,
    branch: SequenceRow['branch'],
    orphan = false
  ): void => {
    counter += 1;
    const scope = index.nodesById.get(nodeId)?.parentId;
    const row: SequenceRow = {
      nodeId,
      stepNumber: counter,
      depth,
      parentRowId,
      branch,
      collapsible:
        isContainer(nodeId) ||
        isBranchSource(index, nodeId, scope) ||
        declaredBranchHandles(nodeId).length > 0,
      collapsed: collapsedSet.has(nodeId),
      visible: true, // resolved in a post-pass once every row exists
      orphan: orphan || undefined,
    };
    rows.push(row);
    rowByNodeId.set(nodeId, row);
    visited.add(nodeId);
  };

  const branchLabel = (ownerId: string, edge: Edge): string =>
    options?.resolveBranchLabel?.(ownerId, sourceHandleOf(edge)) ??
    edgeDataLabel(edge) ??
    edge.sourceHandle ??
    'Branch';

  // Synthetic row for an empty lane. Not added to `visited`/`rowByNodeId`: it has no
  // canonical node and is never numbered.
  const emitLanePlaceholder = (
    ownerId: string,
    depth: number,
    parentRowId: string | undefined,
    handle: { id: string; label: string }
  ): void => {
    const placeholderNodeId = lanePlaceholderId(ownerId, handle.id);
    const slot: InsertionSlot = {
      id: `slot:lane:${ownerId}:${handle.id}`,
      source: { nodeId: ownerId, handleId: handle.id },
      containerId: isContainer(ownerId)
        ? ownerId
        : (index.nodesById.get(ownerId)?.parentId ?? undefined),
    };
    addSlot(slot);
    rows.push({
      nodeId: placeholderNodeId,
      depth,
      parentRowId,
      branch: { sourceNodeId: ownerId, handleId: handle.id, label: handle.label },
      collapsible: false,
      collapsed: false,
      visible: true,
      lanePlaceholder: slot,
      placeholderKind: 'lane',
    });
    // No slot on the connector: the placeholder bar itself is the affordance.
    connectors.push({
      id: `conn:lane:${ownerId}:${handle.id}`,
      kind: 'branch-entry',
      sourceRowId: ownerId,
      targetRowId: placeholderNodeId,
      label: handle.label,
    });
  };

  function walkContainerBody(containerNode: Node, depth: number): void {
    const scope = containerNode.id;
    const entries = entriesForScope(index, scope);

    const children = index.childrenByParent.get(scope) ?? [];

    if (entries.length === 0 && children.length === 0) {
      const bodyHandle = options?.getBranchHandles?.(containerNode)?.[0] ?? {
        id: CONTAINER_START_HANDLE,
        label: CONTAINER_START_LABEL,
      };
      emitLanePlaceholder(containerNode.id, depth + 1, containerNode.id, bodyHandle);
      return;
    }

    // Children but no entry: the body is a cycle with no way in. Walk from the first
    // child in flow order so the closing edge becomes a goto instead of orphaning them.
    const bodyEntries = entries.length > 0 ? entries : [sortByFlow(children)[0]!];

    for (const entry of bodyEntries) {
      const startEdge = index.seqEdgesBySource.get(scope)?.find((edge) => edge.target === entry.id);
      const label =
        options?.resolveBranchLabel?.(scope, startEdge?.sourceHandle ?? CONTAINER_START_HANDLE) ??
        (startEdge ? edgeDataLabel(startEdge) : undefined) ??
        CONTAINER_START_LABEL;
      const slot = startEdge
        ? slotFromEdge(startEdge, scope)
        : addSlot({
            id: `slot:start:${scope}:${entry.id}`,
            source: { nodeId: scope, handleId: CONTAINER_START_HANDLE },
            target: { nodeId: entry.id },
            containerId: scope,
          });
      connectors.push({
        id: startEdge ? `conn:${startEdge.id}` : `conn:start:${scope}:${entry.id}`,
        kind: 'branch-entry',
        sourceRowId: containerNode.id,
        targetRowId: entry.id,
        label,
        slot,
      });
      walkSpine(
        entry.id,
        scope,
        depth + 1,
        containerNode.id,
        { sourceNodeId: scope, handleId: startEdge?.sourceHandle ?? CONTAINER_START_HANDLE, label },
        EMPTY_SCOPE
      );
    }
  }

  function walkBranch(
    ownerId: string,
    branchEdges: Edge[],
    scope: Scope,
    depth: number,
    outerStop: ReadonlySet<string>,
    resolvedMerge?: string
  ): string | undefined {
    const merge = resolvedMerge ?? findMerge(index, branchEdges, scope);
    const laneStop: ReadonlySet<string> = merge ? new Set([...outerStop, merge]) : outerStop;

    for (const edge of branchEdges) {
      const target = edge.target;

      // A branch edge closing a cycle or landing on an already-placed node is a goto,
      // never an insertable lane.
      if (onStack.has(target)) {
        pushGoto(edge, ownerId, target);
        continue;
      }
      if (visited.has(target) && target !== merge) {
        pushGoto(edge, ownerId, target);
        continue;
      }

      const label = branchLabel(ownerId, edge);
      const targetNode = index.nodesById.get(target);
      // Keyed by edge id so two branch edges on the same source handle never collide.
      const slot = slotFromEdge(edge, scope);
      const isEmptyLane =
        target === merge || outerStop.has(target) || !targetNode || targetNode.parentId !== scope;
      connectors.push({
        id: `conn:${edge.id}`,
        kind: 'branch-entry',
        sourceRowId: ownerId,
        targetRowId: target,
        label,
        slot,
      });
      if (isEmptyLane) continue;

      walkSpine(
        target,
        scope,
        depth + 1,
        ownerId,
        { sourceNodeId: ownerId, handleId: sourceHandleOf(edge), label },
        laneStop
      );
    }
    return merge;
  }

  function walkSpine(
    startId: string,
    scope: Scope,
    depth: number,
    parentRowId: string | undefined,
    branchMetaArg: SequenceRow['branch'],
    stopBefore: ReadonlySet<string>
  ): void {
    let currentId: string | undefined = startId;
    let branchMeta = branchMetaArg;
    let firstRow = true;
    const localStack: string[] = [];

    // Advance to a single forward successor; undefined when the walk must stop.
    const stepToSuccessor = (
      fromId: string,
      edge: Edge,
      followsIndentedContent = false
    ): string | undefined => {
      const next = edge.target;
      if (stopBefore.has(next)) {
        // Lane closing into the merge. Keeps its slot: splitting it appends to the lane tail.
        connectors.push({
          id: `conn:merge:${edge.id}`,
          kind: 'merge-back',
          sourceRowId: fromId,
          targetRowId: next,
          slot: slotFromEdge(edge, scope),
        });
        return undefined;
      }
      if (onStack.has(next) || visited.has(next)) {
        pushGoto(edge, fromId, next);
        return undefined;
      }
      connectors.push({
        id: `conn:${edge.id}`,
        kind: isContainer(fromId) || followsIndentedContent ? 'merge-back' : 'step',
        sourceRowId: fromId,
        targetRowId: next,
        slot: slotFromEdge(edge, scope),
      });
      return next;
    };

    while (currentId !== undefined) {
      if (currentId === scope || stopBefore.has(currentId)) break;
      const node = index.nodesById.get(currentId);
      if (!node || node.parentId !== scope || visited.has(currentId)) break;

      emitRow(currentId, depth, parentRowId, firstRow ? branchMeta : undefined);
      onStack.add(currentId);
      localStack.push(currentId);
      firstRow = false;

      if (isContainer(currentId)) walkContainerBody(node, depth);

      const out = forwardOut(index, currentId, scope);
      // Declared handles take precedence over the edge-count heuristic so empty lanes
      // still render as placeholders.
      const branchHandles = declaredBranchHandles(currentId);
      const isDeclaredBranch: boolean = branchHandles.length > 0;

      if (out.length === 0 && !isDeclaredBranch) {
        // Nested leaves get an append placeholder; the top-level tail is served by
        // the canvas's terminal placeholder.
        const leafRow = rowByNodeId.get(currentId);
        if (leafRow && !isContainer(currentId)) {
          leafRow.isLeaf = true;
          if (depth > 0) {
            const slot: InsertionSlot = {
              id: `slot:leaf:${currentId}`,
              source: { nodeId: currentId },
              containerId: scope,
            };
            addSlot(slot);
            const placeholderNodeId = leafPlaceholderId(currentId);
            rows.push({
              nodeId: placeholderNodeId,
              depth,
              parentRowId: leafRow.parentRowId,
              collapsible: false,
              collapsed: false,
              visible: leafRow.visible,
              lanePlaceholder: slot,
              placeholderKind: 'append',
            });
            connectors.push({
              id: `conn:leaf:${currentId}`,
              kind: 'step',
              sourceRowId: currentId,
              targetRowId: placeholderNodeId,
            });
          }
        }
        break;
      }

      if (out.length > 1 || isDeclaredBranch) {
        // Declared-handle edges are lanes; anything else is the continuation output.
        const branchHandleIds = new Set(branchHandles.map((h) => h.id));
        const laneEdges: Edge[] = isDeclaredBranch
          ? out.filter(
              (edge) =>
                !isSequentialContinuationEdge(edge) && branchHandleIds.has(sourceHandleOf(edge))
            )
          : out;
        const continuationEdges: Edge[] = isDeclaredBranch
          ? out.filter(
              (edge) =>
                isSequentialContinuationEdge(edge) || !branchHandleIds.has(sourceHandleOf(edge))
            )
          : [];

        let merge: string | undefined;
        if (isDeclaredBranch) {
          // Resolve the merge from all populated lanes first, then emit in manifest order
          // so an empty Then lane still precedes a populated Else.
          merge = laneEdges.length > 0 ? findMerge(index, laneEdges, scope) : undefined;
          for (const handle of branchHandles) {
            const handleEdges = laneEdges.filter((edge) => sourceHandleOf(edge) === handle.id);
            if (handleEdges.length === 0) {
              emitLanePlaceholder(currentId, depth + 1, currentId, handle);
            } else {
              walkBranch(currentId, handleEdges, scope, depth, stopBefore, merge);
            }
          }
        } else {
          merge =
            laneEdges.length > 0
              ? walkBranch(currentId, laneEdges, scope, depth, stopBefore)
              : undefined;
        }

        // Continue below the branches: prefer the merge, else a single continuation output.
        if (
          merge !== undefined &&
          !stopBefore.has(merge) &&
          !visited.has(merge) &&
          !onStack.has(merge)
        ) {
          currentId = merge;
          branchMeta = undefined;
          continue;
        }
        if (continuationEdges.length === 1) {
          const nextId = stepToSuccessor(currentId, continuationEdges[0]!, true);
          if (nextId !== undefined) {
            currentId = nextId;
            branchMeta = undefined;
            continue;
          }
        }
        break;
      }

      // A container's own continuation uses merge-back geometry but keeps its slot.
      const nextId = stepToSuccessor(currentId, out[0]!);
      if (nextId === undefined) break;
      currentId = nextId;
    }

    for (const id of localStack) onStack.delete(id);
  }

  // A node with no real (non-loopBack) sequence edge is an orphan and must not seed a lane.
  const incidentNodeIds = new Set<string>();
  for (const edge of index.seqEdges) {
    if (isLoopBackEdge(edge)) continue;
    incidentNodeIds.add(edge.source);
    incidentNodeIds.add(edge.target);
  }
  // With no sequence edges at all, each top-level node is its own trivial sequence,
  // not an orphan.
  const hasSequenceContent = incidentNodeIds.size > 0;

  const topEntries = entriesForScope(index, undefined).filter((node) =>
    incidentNodeIds.has(node.id)
  );
  for (const entry of topEntries) {
    walkSpine(entry.id, undefined, 0, undefined, undefined, EMPTY_SCOPE);
  }

  // Cyclic components with no entry, and edge-less nodes. Orphan rows are emitted
  // after every lane so one positioned between two components never splits them.
  const topLevel = index.childrenByParent.get(undefined) ?? [];
  const orphanNodes: Node[] = [];
  for (const node of sortByFlow(topLevel)) {
    if (visited.has(node.id)) continue;
    if (incidentNodeIds.has(node.id)) {
      walkSpine(node.id, undefined, 0, undefined, undefined, EMPTY_SCOPE);
    } else if (hasSequenceContent) {
      orphanNodes.push(node);
    } else {
      // Spine walk so a manifest-known empty container still emits its Body slot.
      walkSpine(node.id, undefined, 0, undefined, undefined, EMPTY_SCOPE);
    }
  }

  for (const node of orphanNodes) {
    emitRow(node.id, 0, undefined, undefined, true);
  }

  // Never-reached nodes (e.g. children of an unreachable container) trail as orphans.
  for (const node of sequenceNodes) {
    if (!visited.has(node.id)) {
      emitRow(node.id, 0, undefined, undefined, true);
    }
  }

  // Unplaced sequence edges become slot-less gotos so compatibility can report them.
  // loopBack closures and a child wiring back into its own container are never drawn.
  for (const edge of index.seqEdges) {
    if (representedEdgeIds.has(edge.id) || isLoopBackEdge(edge)) continue;
    if (!rowByNodeId.has(edge.source) || !rowByNodeId.has(edge.target)) continue;
    if (index.nodesById.get(edge.source)?.parentId === edge.target) continue;
    pushGoto(edge, edge.source, edge.target);
  }

  // Rows are in pre-order, so a parent's visibility is always resolved first.
  const rowsById = new Map(rows.map((row) => [row.nodeId, row]));
  for (const row of rows) {
    const parent = row.parentRowId ? rowsById.get(row.parentRowId) : undefined;
    row.visible = parent ? parent.visible && !parent.collapsed : true;
  }

  return { rows, connectors, slots: [...slotsById.values()] };
}
