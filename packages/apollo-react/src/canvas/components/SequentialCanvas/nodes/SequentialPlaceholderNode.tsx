import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { SEQ_HANDLE_LEFT_OFFSET } from '../../../constants';
import { CanvasIcon } from '../../../utils/icon-registry';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import {
  getSeqBarVars,
  INVISIBLE_BRANCH_HANDLE_STYLE,
  INVISIBLE_HANDLE_STYLE,
  SEQ_BAR_SHELL_CLASS,
  SEQUENTIAL_BAR_HANDLE_IDS,
} from '../../BaseNode/BaseNodeBar';
import { CanvasInlineButton } from '../../ButtonHandle/CanvasInlineButton';
import { SEQ_INSERT_REST_CLASS } from '../edges/SequentialInsertButton';
import { useSequentialLaneAdd } from '../SequentialLaneAddContext';

export interface SequentialPlaceholderNodeData extends Record<string, unknown> {
  /** Terminal placeholder: stable append callback. Lane placeholders use the context instead. */
  onAdd?: () => void;
  /** View-only slot identity; a lane placeholder adds through `useSequentialLaneAdd` with it. */
  insertionSlotId?: string;
  /**
   * 'row' (default): a dashed "Add step" bar for an empty lane or body.
   * 'plus': a quiet plus for the trailing add point after a populated lane.
   */
  variant?: 'row' | 'plus';
}

/**
 * Synthetic "add a step" row, injected view-only. 'row' is a dashed bar-sized drop
 * target for an empty lane or body; 'plus' matches the between-step insert for a
 * trailing append. Carries a top handle (tail) and a mid-left handle (empty lane).
 */
function SequentialPlaceholderNodeComponent({
  data,
  width,
  height,
}: NodeProps<Node<SequentialPlaceholderNodeData>>) {
  const { _ } = useSafeLingui();
  const laneAdd = useSequentialLaneAdd();
  const slotId = data?.insertionSlotId;
  const onAdd =
    data?.onAdd ?? (laneAdd && slotId !== undefined ? () => laneAdd(slotId) : undefined);
  const isDesignMode = useBaseCanvasMode().mode === 'design';
  const label = _({ id: 'sequential-canvas.placeholder.add', message: 'Add step' });
  const variant = data?.variant ?? 'row';

  const handles = (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id={SEQUENTIAL_BAR_HANDLE_IDS.target}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
      {/* Mid-left entry: an empty branch lane is entered from the side. */}
      <Handle
        type="target"
        position={Position.Left}
        id={SEQUENTIAL_BAR_HANDLE_IDS.branchTarget}
        isConnectable={false}
        style={INVISIBLE_BRANCH_HANDLE_STYLE}
      />
    </>
  );

  if (variant === 'plus') {
    // The box spans the row gap; the plus centers on the handle column and is the
    // only interactive part, so hiding it in readonly moves no node.
    return (
      <div
        className="relative h-(--node-h) w-(--node-w) pointer-events-none"
        style={getSeqBarVars(width, height)}
        data-testid="sequential-placeholder-plus"
      >
        {handles}
        <div
          className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: SEQ_HANDLE_LEFT_OFFSET, top: '50%' }}
        >
          <CanvasInlineButton
            icon="plus"
            iconSize={16}
            aria-label={label}
            disabled={!isDesignMode || !onAdd}
            className={SEQ_INSERT_REST_CLASS}
            onClick={(e) => {
              e.stopPropagation();
              if (isDesignMode) onAdd?.();
            }}
          />
        </div>
      </div>
    );
  }

  // Handles are siblings of the button: a <button> allows only phrasing content
  // and xyflow's <Handle> renders a <div>.
  return (
    <div className="relative" style={getSeqBarVars(width, height)}>
      {handles}
      <button
        type="button"
        className={cn(
          SEQ_BAR_SHELL_CLASS,
          'nodrag justify-center border-dashed border-border-de-emp bg-transparent text-foreground-muted shadow-none',
          'cursor-pointer transition-colors hover:border-border hover:text-foreground disabled:cursor-default'
        )}
        data-testid="sequential-placeholder-bar"
        aria-label={label}
        disabled={!isDesignMode || !onAdd}
        onClick={(e) => {
          e.stopPropagation();
          if (isDesignMode) onAdd?.();
        }}
      >
        <CanvasIcon icon="plus" size={20} />
        <span className="text-sm font-semibold leading-[18px]">{label}</span>
      </button>
    </div>
  );
}

export const SequentialPlaceholderNode = memo(SequentialPlaceholderNodeComponent);
