import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_TRIGGER_NODE_TYPE } from '../../constants';
import {
  buildGraphIndex,
  defaultIsSequenceEdge,
  edgeDataLabel,
  entriesForScope,
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
import type {
  InsertionSlot,
  ProjectSequenceOptions,
  SequenceConnector,
  SequenceConnectorKind,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';

const CONTAINER_START_LABEL = 'Body';
const CONTAINER_START_HANDLE = 'start';
const EMPTY_SCOPE: ReadonlySet<string> = new Set();

/**
 * Pure, structure-only projection of the canonical graph into sequential rows,
 * connectors, and insertion slots.
 *
 * Algorithm (see the module helpers for the primitives):
 *  - Sequence edges = non-preview edges passing `isSequenceEdge`; `loopBack`
 *    edges are consumed as loop closure, never traversed as forward steps.
 *  - Walk begins at the entry set (nodes with no in-scope forward incomer),
 *    ordered by flow-view y. A DFS pre-order assigns the flat `stepNumber`
 *    counter BEFORE any collapse filtering (D7); synthetic rows do not exist at
 *    this layer (start bar + placeholder are injected view-only by the assembly).
 *  - Containers (a node with children) open an indented "Body" lane; branch
 *    nodes (>1 forward edge) open one labeled lane per branch. Both close at a
 *    shared merge (immediate post-dominator, see mergeAnalysis); lane tails draw
 *    `merge-back` connectors into it.
 *  - Malformed shapes never hard-fail: multi-root => stacked lanes; unstructured
 *    merge => first-incomer-wins + `goto`; non-loopBack cycle => dashed upward
 *    `goto` + visited-set guard (prevents infinite recursion); orphans =>
 *    appended trailing rows so a node is never silently dropped.
 *  - `slots` include the empty-branch-body case so an empty lane still shows an
 *    insert point.
 */
export function projectSequence(
  nodes: Node[],
  edges: Edge[],
  options?: ProjectSequenceOptions
): SequenceProjection {
  const isSequenceEdge = options?.isSequenceEdge ?? defaultIsSequenceEdge;
  const isStartNode =
    options?.isStartNode ?? ((node: Node) => node.type === DEFAULT_TRIGGER_NODE_TYPE);
  const collapsedSet = options?.collapsedStepIds ?? EMPTY_SCOPE;
  const sequenceNodes = nodes.filter((node) => !isStartNode(node));
  const sequenceNodeIds = new Set(sequenceNodes.map((node) => node.id));
  const sequenceEdges = edges.filter(
    (edge) => sequenceNodeIds.has(edge.source) && sequenceNodeIds.has(edge.target)
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

  const slotFromEdge = (edge: Edge, containerId: Scope): InsertionSlot =>
    addSlot({
      id: `slot:edge:${edge.id}`,
      source: { nodeId: edge.source, handleId: edge.sourceHandle ?? undefined },
      target: { nodeId: edge.target, handleId: edge.targetHandle ?? undefined },
      graphEdgeId: edge.id,
      containerId: containerId ?? undefined,
      continuation: isSequentialContinuationEdge(edge) || undefined,
    });

  const pushConnector = (
    kind: SequenceConnectorKind,
    id: string,
    source: string,
    target: string,
    label?: string,
    slot?: InsertionSlot
  ): void => {
    connectors.push({ id, kind, sourceRowId: source, targetRowId: target, label, slot });
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

  // Synthetic empty-lane placeholder: a parent's declared branch handle with no
  // child yet. Renders as an indented dashed "+ Add step" bar entered mid-left,
  // carrying the slot that appends the first node into that lane. Not added to
  // `visited`/`rowByNodeId` — it has no canonical node and is never numbered.
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
    // No ⊕ slot on the connector — the placeholder bar itself is the affordance.
    pushConnector(
      'branch-entry',
      `conn:lane:${ownerId}:${handle.id}`,
      ownerId,
      placeholderNodeId,
      handle.label
    );
  };

  function walkContainerBody(containerNode: Node, depth: number): void {
    const scope = containerNode.id;
    const entries = entriesForScope(index, scope);

    if (entries.length === 0) {
      // Empty container body: render a "Body" lane placeholder ("+ Add step")
      // so the empty body is visible and insertable, entered mid-left like any
      // branch lane. The body handle/label come from the manifest when known.
      const bodyHandle = options?.getBranchHandles?.(containerNode)?.[0] ?? {
        id: CONTAINER_START_HANDLE,
        label: CONTAINER_START_LABEL,
      };
      emitLanePlaceholder(containerNode.id, depth + 1, containerNode.id, bodyHandle);
      return;
    }

    for (const entry of entries) {
      const startEdge = index.seqEdges.find(
        (edge) => edge.source === scope && edge.target === entry.id
      );
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
      pushConnector(
        'branch-entry',
        startEdge ? `conn:${startEdge.id}` : `conn:start:${scope}:${entry.id}`,
        containerNode.id,
        entry.id,
        label,
        slot
      );
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

      // Classify the target BEFORE emitting anything: a branch edge that closes
      // a cycle or jumps into a node already placed by another lane is a
      // cycle/unstructured-merge (D9), never an insertable branch-entry lane.
      // This mirrors walkSpine's single-successor handling below.
      if (onStack.has(target)) {
        pushConnector('goto', `conn:goto:${edge.id}`, ownerId, target);
        continue;
      }
      if (visited.has(target) && target !== merge) {
        pushConnector('goto', `conn:goto:${edge.id}`, ownerId, target);
        continue;
      }

      const label = branchLabel(ownerId, edge);
      const targetNode = index.nodesById.get(target);
      const slot = slotFromEdge(edge, scope);
      const isEmptyLane =
        target === merge || outerStop.has(target) || !targetNode || targetNode.parentId !== scope;
      if (isEmptyLane) {
        pushConnector('branch-entry', `conn:${edge.id}`, ownerId, target, label, slot);
        addSlot({
          // Disambiguated with the edge id: two branch edges sharing the
          // default source handle (e.g. imported/degraded graphs) must not
          // collide on the same empty-lane slot.
          id: `slot:empty:${ownerId}:${sourceHandleOf(edge)}:${edge.id}`,
          source: { nodeId: ownerId, handleId: edge.sourceHandle ?? undefined },
          // Built from the edge itself, not from `merge`: this is the same
          // endpoint the connector splits regardless of whether findMerge
          // resolved a shared join, so the handle is never lost.
          target: { nodeId: edge.target, handleId: edge.targetHandle ?? undefined },
          graphEdgeId: edge.id,
          containerId: scope ?? undefined,
        });
        continue;
      }

      pushConnector('branch-entry', `conn:${edge.id}`, ownerId, target, label, slot);
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
    parentRowIdArg: string | undefined,
    branchMetaArg: SequenceRow['branch'],
    stopBefore: ReadonlySet<string>
  ): void {
    let currentId: string | undefined = startId;
    const parentRowId = parentRowIdArg;
    let branchMeta = branchMetaArg;
    let firstRow = true;
    const localStack: string[] = [];

    // Advance the spine to a single forward successor, pushing the connecting
    // edge. Returns the next node id, or undefined when the walk must stop
    // (merge-back / goto / cycle). Shared by the plain single-successor case and
    // a declared branch node's continuation output.
    const stepToSuccessor = (
      fromId: string,
      edge: Edge,
      followsIndentedContent = false
    ): string | undefined => {
      const next = edge.target;
      if (stopBefore.has(next)) {
        // A branch/loop lane closing into the shared merge. The closing edge is a
        // real graph edge, so it stays insertable: splitting it appends a step to
        // the END of this lane (before the merge), the same as any other gap. The
        // dashed merge-back style is kept; only the missing slot is restored.
        pushConnector(
          'merge-back',
          `conn:merge:${edge.id}`,
          fromId,
          next,
          undefined,
          slotFromEdge(edge, scope)
        );
        return undefined;
      }
      if (onStack.has(next) || visited.has(next)) {
        pushConnector('goto', `conn:goto:${edge.id}`, fromId, next);
        return undefined;
      }
      pushConnector(
        isContainer(fromId) || followsIndentedContent ? 'merge-back' : 'step',
        `conn:${edge.id}`,
        fromId,
        next,
        undefined,
        slotFromEdge(edge, scope)
      );
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
      // Manifest-declared branch lanes (If → then/else, while → body, try/catch)
      // for a non-container parent. When present, the node's forward flow is
      // routed through its DECLARED handles rather than the edge-count heuristic,
      // so every lane renders — populated ones walk, empty ones get a "+ Add
      // step" placeholder — regardless of how many branches are wired yet.
      const branchHandles = declaredBranchHandles(currentId);
      const isDeclaredBranch: boolean = branchHandles.length > 0;

      if (out.length === 0 && !isDeclaredBranch) {
        // Terminal nested rows get the same full-width dashed Add step row as
        // an empty branch. This keeps populated and empty branch insertion UX
        // identical; the top-level tail remains served by the canvas's single
        // terminal placeholder.
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
            pushConnector('step', `conn:leaf:${currentId}`, currentId, placeholderNodeId);
          }
        }
        break;
      }

      if (out.length > 1 || isDeclaredBranch) {
        // Split a declared branch node's outputs into lane edges (declared
        // handles) vs a single continuation output (e.g. a loop's Completed).
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
          // Compute the merge from every populated lane, then emit each lane in
          // manifest order. This keeps an empty Then lane before a populated
          // Else lane instead of grouping all populated lanes first.
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

        // Continue below the branches: prefer the branch merge; else follow a
        // single continuation output as a plain spine step.
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

      // Plain single successor (not a declared branch). A container's own
      // forward continuation rejoins the spine after its indented body, so it
      // uses merge-back geometry while keeping its slot. Straight container
      // continuations still render solid in SequentialConnectorEdge.
      const nextId = stepToSuccessor(currentId, out[0]!);
      if (nextId === undefined) break;
      currentId = nextId;
    }

    for (const id of localStack) onStack.delete(id);
  }

  // Nodes touched by at least one real (non-loopBack) sequence edge. A node with
  // none is an orphan even if its in-degree is zero, so it must not seed a lane.
  const incidentNodeIds = new Set<string>();
  for (const edge of index.seqEdges) {
    if (isLoopBackEdge(edge)) continue;
    incidentNodeIds.add(edge.source);
    incidentNodeIds.add(edge.target);
  }
  // A graph with no sequence edges anywhere has no "real" content for a node to
  // be orphaned relative to: every top-level node (most commonly, the single
  // node on an otherwise-empty canvas) is trivially its own one-row sequence
  // rather than a de-emphasized orphan (D9).
  const hasSequenceContent = incidentNodeIds.size > 0;

  // Top-level roots: entries with no forward incomer, stacked by flow-view y.
  const topEntries = entriesForScope(index, undefined).filter((node) =>
    incidentNodeIds.has(node.id)
  );
  for (const entry of topEntries) {
    walkSpine(entry.id, undefined, 0, undefined, undefined, EMPTY_SCOPE);
  }

  // Disconnected / cyclic top-level components with no zero-in-degree entry,
  // and genuinely edge-less nodes. Orphans are collected here but their rows
  // are emitted only after every lane has been walked, so an orphan positioned
  // between two components (in flow-y order) always ends up in the trailing
  // section (D9) instead of splitting the two lanes' rows apart.
  const topLevel = index.childrenByParent.get(undefined) ?? [];
  const orphanNodes: Node[] = [];
  for (const node of sortByFlow(topLevel)) {
    if (visited.has(node.id)) continue;
    if (incidentNodeIds.has(node.id)) {
      walkSpine(node.id, undefined, 0, undefined, undefined, EMPTY_SCOPE);
    } else if (hasSequenceContent) {
      orphanNodes.push(node);
    } else {
      // No sequence content anywhere in the graph: this edge-less node is a
      // trivial entry (e.g. the first node on an empty canvas), not an orphan.
      // Use the normal spine walk so a manifest-known empty container still
      // emits its Body insertion slot and structural children, if any.
      walkSpine(node.id, undefined, 0, undefined, undefined, EMPTY_SCOPE);
    }
  }

  for (const node of orphanNodes) {
    emitRow(node.id, 0, undefined, undefined, true);
  }

  // Any node never reached (e.g. a child of an unreachable container) is
  // appended as an orphan so the projection never silently drops a node.
  for (const node of sequenceNodes) {
    if (!visited.has(node.id)) {
      emitRow(node.id, 0, undefined, undefined, true);
    }
  }

  // Visibility: a row is hidden when any ancestor row is collapsed. Rows are in
  // pre-order so a parent's resolved visibility is always available first (D7).
  const rowsById = new Map(rows.map((row) => [row.nodeId, row]));
  for (const row of rows) {
    const parent = row.parentRowId ? rowsById.get(row.parentRowId) : undefined;
    row.visible = parent ? parent.visible && !parent.collapsed : true;
  }

  return { rows, connectors, slots: [...slotsById.values()] };
}
