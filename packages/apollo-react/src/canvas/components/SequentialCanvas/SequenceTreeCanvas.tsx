import type { Edge, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useRef } from 'react';
import { projectTree } from '../../utils/sequential/projectTree';
import type { InsertionSlot, SequenceStep, SlotRef } from '../../utils/sequential/sequential.types';
import { treeMoveOptions } from '../../utils/sequential/treeMoves';
import { SequentialCanvas } from './SequentialCanvas';
import type { SequentialCanvasProps } from './SequentialCanvas.types';
import type { SequentialMoveActionsContextValue } from './SequentialMoveActionsContext';

/** What the user asked of a tree; the host applies it to its own model and sends a new tree. */
export type SequenceIntent =
  | { type: 'insert'; at: SlotRef }
  | { type: 'move'; id: string; to: SlotRef }
  | { type: 'remove'; id: string }
  | { type: 'rename'; id: string; label: string }
  | { type: 'select'; ids: string[] }
  | { type: 'collapse'; id: string; collapsed: boolean }
  | { type: 'open'; id: string };

type HostOwnedProps =
  | 'nodes'
  | 'edges'
  | 'view'
  | 'sequenceProjection'
  | 'onInsertSlot'
  | 'onRemoveStep'
  | 'moveActions'
  | 'onNodesChange'
  | 'onEdgesChange'
  | 'collapsedStepIds'
  | 'onCollapsedStepIdsChange'
  | 'onPrimaryAction'
  | 'onAddTrigger'
  | 'addNodeManagerProps'
  | 'sequencedContainerIds'
  | 'onSequencedContainerIdsChange'
  | 'isSequenceNode'
  | 'flowNodeTypes'
  | 'flowEdgeTypes';

export interface SequenceTreeCanvasProps
  extends Omit<SequentialCanvasProps<Node, Edge>, HostOwnedProps> {
  /** The level the host shows: a list (one slot) or any step with slots. */
  root: SequenceStep;
  selectedIds?: readonly string[];
  collapsedIds?: readonly string[];
  /** Every edit, selection and collapse, as the host's own terms. The canvas changes nothing itself. */
  onIntent: (intent: SequenceIntent) => void;
}

const NO_EDGES: Edge[] = [];
const NO_IDS: readonly string[] = [];

/**
 * The sequential view of a tree the host owns: a controlled canvas that draws `root` and reports
 * what the user asks as {@link SequenceIntent}s. Insert affordances hand back the slot the step goes
 * into; the host picks the activity (its own palette), applies the edit, and sends the new tree.
 */
export function SequenceTreeCanvas({
  root,
  selectedIds = NO_IDS,
  collapsedIds = NO_IDS,
  onIntent,
  ...canvasProps
}: SequenceTreeCanvasProps) {
  const onIntentRef = useRef(onIntent);
  onIntentRef.current = onIntent;
  const rootRef = useRef(root);
  rootRef.current = root;

  const collapsedSet = useMemo(() => new Set(collapsedIds), [collapsedIds]);
  const collapsedList = useMemo(() => [...collapsedSet], [collapsedSet]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const { projection, nodes: stepNodes } = useMemo(
    () => projectTree(root, { collapsedStepIds: collapsedSet }),
    [root, collapsedSet]
  );
  const nodes = useMemo(
    () => stepNodes.map((node) => (selectedSet.has(node.id) ? { ...node, selected: true } : node)),
    [stepNodes, selectedSet]
  );
  const labelById = useMemo(
    () => new Map(stepNodes.map((node) => [node.id, labelOf(node.data)])),
    [stepNodes]
  );

  const emit = useCallback((intent: SequenceIntent) => onIntentRef.current(intent), []);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      let selection: Set<string> | undefined;
      for (const change of changes) {
        if (change.type === 'select') {
          selection ??= new Set(selectedSet);
          if (change.selected) selection.add(change.id);
          else selection.delete(change.id);
        } else if (change.type === 'replace') {
          const label = labelOf(change.item.data);
          if (label !== undefined && label !== labelById.get(change.id)) {
            emit({ type: 'rename', id: change.id, label });
          }
        }
      }
      if (selection && !sameSet(selection, selectedSet)) {
        emit({ type: 'select', ids: [...selection] });
      }
    },
    [emit, labelById, selectedSet]
  );

  const onCollapsedStepIdsChange = useCallback(
    (ids: string[]) => {
      const next = new Set(ids);
      for (const id of next)
        if (!collapsedSet.has(id)) emit({ type: 'collapse', id, collapsed: true });
      for (const id of collapsedSet)
        if (!next.has(id)) emit({ type: 'collapse', id, collapsed: false });
    },
    [collapsedSet, emit]
  );

  const onInsertSlot = useCallback(
    (slot: InsertionSlot) => {
      if (slot.ref) emit({ type: 'insert', at: slot.ref });
    },
    [emit]
  );
  const onRemoveStep = useCallback((id: string) => emit({ type: 'remove', id }), [emit]);
  const onPrimaryAction = useCallback((id: string) => emit({ type: 'open', id }), [emit]);

  // Rebuilt per tree only: every bar reads it through context.
  const moveActions = useMemo<SequentialMoveActionsContextValue>(
    () => ({
      getMoveOptions: (nodeId) => treeMoveOptions(root, nodeId),
      commitMove: (nodeId, slot) => {
        if (slot.ref) emit({ type: 'move', id: nodeId, to: slot.ref });
      },
    }),
    [root, emit]
  );

  return (
    <SequentialCanvas
      {...canvasProps}
      view="sequential"
      nodes={nodes}
      edges={NO_EDGES}
      sequenceProjection={projection}
      collapsedStepIds={collapsedList}
      onCollapsedStepIdsChange={onCollapsedStepIdsChange}
      onNodesChange={onNodesChange}
      onInsertSlot={onInsertSlot}
      onRemoveStep={onRemoveStep}
      onPrimaryAction={onPrimaryAction}
      moveActions={moveActions}
    />
  );
}

/** The bar's label, where BaseNode keeps it. */
function labelOf(data: unknown): string | undefined {
  const label = (data as { display?: { label?: unknown } } | undefined)?.display?.label;
  return typeof label === 'string' ? label : undefined;
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}
