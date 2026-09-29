import { EdgeLabelRenderer, type XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { type MouseEvent as ReactMouseEvent, useCallback } from 'react';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';
import { CanvasInlineButton } from '../../ButtonHandle/CanvasInlineButton';
import { SEQ_DROP_OVER_CLASS, useSequentialDropTarget } from '../SequentialExternalDropContext';

export interface SequentialInsertButtonProps {
  /** Center point in flow coordinates (the connector midpoint). */
  point: XYPosition;
  /** Accessible label, already localized. */
  label: string;
  /** Invoked on click; opens the Add Node panel for the connector's slot. */
  onInsert: () => void;
  /** The connector's slot, reported to `externalDrop.onDrop` when something is dropped here. */
  slot?: InsertionSlot;
}

/**
 * Statically centered ⊕ affordance for a sequential connector (design mode
 * only; the caller gates on slot presence + mode). It rests at a low opacity so
 * every insertable connector shows a quiet ⊕, then brightens to full on
 * hover/focus. This keeps add points discoverable without a wall of
 * full-strength buttons when several nested slots are nearby, and pairs with the
 * plus variant of SequentialPlaceholderNode so "add a step" looks identical
 * everywhere. Unlike the
 * hover-following EdgeToolbar (see Toolbar/EdgeToolbar/useEdgeToolbarPositioning.ts),
 * this sits at a fixed point on the connector and never tracks the pointer.
 *
 * It stops mousedown/click propagation so opening the Add Node panel does not
 * trip the Toolbox's outside-mousedown close (components/Toolbox/Toolbox.tsx:621-625).
 *
 * During an accepted external drag it shows at full strength, since `:hover`
 * does not update mid-drag, and takes the drop for `slot`.
 */
export function SequentialInsertButton({
  point,
  label,
  onInsert,
  slot,
}: SequentialInsertButtonProps) {
  const { dropProps, isDragActive, isOver } = useSequentialDropTarget(slot);
  const stopMouseDown = useCallback((event: ReactMouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleClick = useCallback(
    (event: ReactMouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      onInsert();
    },
    [onInsert]
  );

  return (
    <EdgeLabelRenderer>
      <div
        className="group nodrag nopan absolute top-0 left-0 z-1004 pointer-events-auto"
        style={{ transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)` }}
        onMouseDown={stopMouseDown}
        {...dropProps}
      >
        <CanvasInlineButton
          aria-label={label}
          icon="plus"
          className={cn(
            'opacity-40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
            isDragActive && 'opacity-100',
            isOver && SEQ_DROP_OVER_CLASS
          )}
          onMouseDown={stopMouseDown}
          onClick={handleClick}
        />
      </div>
    </EdgeLabelRenderer>
  );
}
