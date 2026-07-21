import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
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
  const labelsById = new Map(nodes.map((node) => [node.id, node.ariaLabel ?? node.id]));

  return (
    <ol
      className="sr-only"
      aria-label={_({ id: 'sequential-canvas.steps.aria-label', message: 'Workflow steps' })}
    >
      {rows.map((row) => {
        const label = labelsById.get(row.nodeId) ?? row.nodeId;
        return (
          <li key={row.nodeId}>
            <button
              type="button"
              aria-current={selectedNodeId === row.nodeId ? 'step' : undefined}
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
                {row.collapsed
                  ? _({
                      id: 'sequential-canvas.gutter.expand-step',
                      message: 'Expand step {stepNumber}',
                      values: { stepNumber: row.stepNumber },
                    })
                  : _({
                      id: 'sequential-canvas.gutter.collapse-step',
                      message: 'Collapse step {stepNumber}',
                      values: { stepNumber: row.stepNumber },
                    })}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
