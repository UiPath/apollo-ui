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
  INVISIBLE_HANDLE_STYLE,
  SEQ_BAR_SHELL_CLASS,
  SEQUENTIAL_BAR_HANDLE_IDS,
} from '../../BaseNode/BaseNodeBar';
import { CanvasInlineButton } from '../../ButtonHandle/CanvasInlineButton';
import {
  SEQ_DROP_OVER_CLASS,
  useSequentialDropTarget,
  useSequentialExternalDrop,
} from '../SequentialExternalDropContext';

/**
 * The faint-until-hover treatment shared by every sequential insert affordance
 * (the connector plus in SequentialInsertButton and this node's plus variant),
 * so "add a step" reads and behaves identically wherever it appears.
 */
const SEQ_INSERT_REST_CLASS =
  'opacity-40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';

export interface SequentialPlaceholderNodeData extends Record<string, unknown> {
  /** Invoked when the affordance is clicked to add a step into this scope. */
  onAdd?: () => void;
  /** View-only slot identity used to recover this row's position when clicked. */
  insertionSlotId?: string;
  /**
   * Which affordance to render (see `SequenceRow.placeholderKind`):
   *  - 'row'  (default): a dashed "Add step" bar for a genuinely empty lane/body.
   *  - 'plus': a quiet plus matching the between-step insert, for the trailing
   *            add point after a populated lane's last step (or the tail).
   */
  variant?: 'row' | 'plus';
}

/**
 * Synthetic "add a step" row. Two shapes, chosen by `data.variant`:
 *  - 'row': a dashed, bar-sized drop target with a centered plus and label,
 *    styled after AddNodePreview. Used where a lane or body is genuinely empty
 *    and there is no connector to host a plus.
 *  - 'plus': the same quiet plus used between steps, anchored on the incoming
 *    connector, so appending at the end of a list looks identical to inserting
 *    between two steps.
 *
 * It carries a top target handle (the tail follows the last step) and a mid-left
 * handle (an empty lane is entered from the side). Injected view-only and
 * filtered out of the change callbacks by the canvas assembly.
 *
 * Both shapes are also external drop targets for the slot their click opens.
 */
function SequentialPlaceholderNodeComponent({
  id,
  data,
  width,
  height,
}: NodeProps<Node<SequentialPlaceholderNodeData>>) {
  const { _ } = useSafeLingui();
  const onAdd = data?.onAdd;
  const isDesignMode = useBaseCanvasMode().mode === 'design';
  const label = _({ id: 'sequential-canvas.placeholder.add', message: 'Add step' });
  const variant = data?.variant ?? 'row';
  const dropSlot = useSequentialExternalDrop()?.getPlaceholderSlot(id);
  const { dropProps, isDragActive, isOver } = useSequentialDropTarget(dropSlot);

  const handles = (
    <>
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
    </>
  );

  if (variant === 'plus') {
    // The box spans the row gap (no reserved row). Center the plus on the shared
    // handle column so it sits in the gap below the last step, exactly like a
    // between-step insert. The box itself is non-interactive so only the plus
    // takes clicks, and it hides cleanly in readonly without moving any node.
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
          {...dropProps}
        >
          <CanvasInlineButton
            icon="plus"
            iconSize={16}
            aria-label={label}
            disabled={!isDesignMode || !onAdd}
            className={cn(
              SEQ_INSERT_REST_CLASS,
              isDragActive && 'opacity-100',
              isOver && SEQ_DROP_OVER_CLASS
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (isDesignMode) onAdd?.();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        SEQ_BAR_SHELL_CLASS,
        'nodrag justify-center border-dashed border-border-de-emp bg-transparent text-foreground-muted shadow-none',
        'cursor-pointer transition-colors hover:border-border hover:text-foreground disabled:cursor-default',
        isOver && cn(SEQ_DROP_OVER_CLASS, 'text-foreground')
      )}
      style={getSeqBarVars(width, height)}
      {...dropProps}
      data-testid="sequential-placeholder-bar"
      aria-label={label}
      disabled={!isDesignMode || !onAdd}
      onClick={(e) => {
        e.stopPropagation();
        if (isDesignMode) onAdd?.();
      }}
    >
      {handles}
      <CanvasIcon icon="plus" size={20} />
      <span className="text-sm font-semibold leading-[18px]">{label}</span>
    </button>
  );
}

export const SequentialPlaceholderNode = memo(SequentialPlaceholderNodeComponent);
