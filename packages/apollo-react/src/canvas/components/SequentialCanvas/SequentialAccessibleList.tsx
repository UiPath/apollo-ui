import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useSafeLingui } from '../../../i18n';
import type { SequentialKeyboardRow } from './useSequentialKeyboard';

interface AccessibleRow extends SequentialKeyboardRow {
  stepNumber?: number;
}

export interface SequentialAccessibleListProps {
  rows: readonly AccessibleRow[];
  nodes: readonly Node[];
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string, collapsed: boolean) => void;
}

interface SequentialAccessibleRowProps {
  row: AccessibleRow;
  label: string;
  selected: boolean;
  toggleLabel?: string;
  onSelectNode: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string, collapsed: boolean) => void;
}

const SequentialAccessibleRow = memo(function SequentialAccessibleRow({
  row,
  label,
  selected,
  toggleLabel,
  onSelectNode,
  onToggleCollapse,
}: SequentialAccessibleRowProps) {
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? 'step' : undefined}
        onClick={() => onSelectNode(row.nodeId)}
      >
        {label}
      </button>
      {row.collapsible && (
        <button
          type="button"
          aria-expanded={!row.collapsed}
          onClick={() => onToggleCollapse(row.nodeId, !row.collapsed)}
        >
          {toggleLabel}
        </button>
      )}
    </li>
  );
});

/**
 * Screen-reader fallback used when the visual canvas must virtualize a very
 * large graph. The visual ReactFlow subtree is aria-hidden in that mode, while
 * this focusable, DOM-ordered list keeps every step reachable and operable.
 */
export function SequentialAccessibleList({
  rows,
  nodes,
  selectedNodeId,
  onSelectNode,
  onToggleCollapse,
}: SequentialAccessibleListProps) {
  const { _ } = useSafeLingui();
  const labelsById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node.ariaLabel ?? node.id])),
    [nodes]
  );
  const callbacksRef = useRef({ onSelectNode, onToggleCollapse });
  callbacksRef.current = { onSelectNode, onToggleCollapse };
  const selectNode = useCallback((nodeId: string) => callbacksRef.current.onSelectNode(nodeId), []);
  const toggleCollapse = useCallback(
    (nodeId: string, collapsed: boolean) =>
      callbacksRef.current.onToggleCollapse(nodeId, collapsed),
    []
  );

  return (
    <ol
      className="sr-only"
      aria-label={_({ id: 'sequential-canvas.steps.aria-label', message: 'Workflow steps' })}
    >
      {rows.map((row) => {
        const label = labelsById.get(row.nodeId) ?? row.nodeId;
        const toggleLabel = !row.collapsible
          ? undefined
          : row.collapsed
            ? _({
                id: 'sequential-canvas.gutter.expand-step',
                message: 'Expand step {stepNumber}',
                values: { stepNumber: row.stepNumber },
              })
            : _({
                id: 'sequential-canvas.gutter.collapse-step',
                message: 'Collapse step {stepNumber}',
                values: { stepNumber: row.stepNumber },
              });
        return (
          <SequentialAccessibleRow
            key={row.nodeId}
            row={row}
            label={label}
            selected={selectedNodeId === row.nodeId}
            toggleLabel={toggleLabel}
            onSelectNode={selectNode}
            onToggleCollapse={toggleCollapse}
          />
        );
      })}
    </ol>
  );
}
