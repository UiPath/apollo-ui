import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { CanvasIcon } from '../../../utils/icon-registry';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import {
  getSeqBarVars,
  INVISIBLE_HANDLE_STYLE,
  SEQ_BAR_SHELL_CLASS,
  SEQUENTIAL_BAR_HANDLE_IDS,
} from '../../BaseNode/BaseNodeBar';

export interface SequentialPlaceholderNodeData extends Record<string, unknown> {
  /** Invoked when the placeholder row is clicked to add a trailing step. */
  onAdd?: () => void;
  /** View-only slot identity used to recover this row's position when clicked. */
  insertionSlotId?: string;
}

/**
 * Synthetic terminal "add a step" row. A dashed, bar-sized drop target styled
 * after AddNodePreview with a centered plus. It carries only a top target handle
 * (it follows the last real step). Injected view-only and filtered out of the
 * change callbacks by the canvas assembly.
 */
function SequentialPlaceholderNodeComponent({
  data,
  width,
  height,
}: NodeProps<Node<SequentialPlaceholderNodeData>>) {
  const { _ } = useSafeLingui();
  const onAdd = data?.onAdd;
  const isDesignMode = useBaseCanvasMode().mode === 'design';
  const label = _({ id: 'sequential-canvas.placeholder.add', message: 'Add step' });

  return (
    <button
      type="button"
      className={cn(
        SEQ_BAR_SHELL_CLASS,
        'nodrag justify-center border-dashed border-border-de-emp bg-transparent text-foreground-muted shadow-none',
        'cursor-pointer transition-colors hover:border-border hover:text-foreground disabled:cursor-default'
      )}
      style={getSeqBarVars(width, height)}
      data-testid="sequential-placeholder-bar"
      aria-label={label}
      disabled={!isDesignMode || !onAdd}
      onClick={(e) => {
        e.stopPropagation();
        if (isDesignMode) onAdd?.();
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id={SEQUENTIAL_BAR_HANDLE_IDS.target}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
      {/* Mid-left entry so an empty-branch-lane placeholder is entered from the
          side like a real branch child (the tail placeholder still uses Top). */}
      <Handle
        type="target"
        position={Position.Left}
        id={SEQUENTIAL_BAR_HANDLE_IDS.branchTarget}
        isConnectable={false}
        style={{ background: 'transparent', border: 'none', width: 8, height: 8 }}
      />
      <CanvasIcon icon="plus" size={20} />
      <span className="text-sm font-semibold leading-[18px]">{label}</span>
    </button>
  );
}

export const SequentialPlaceholderNode = memo(SequentialPlaceholderNodeComponent);
