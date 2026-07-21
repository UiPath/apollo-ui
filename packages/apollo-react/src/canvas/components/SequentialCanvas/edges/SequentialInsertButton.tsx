import { EdgeLabelRenderer, type XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { type MouseEvent as ReactMouseEvent, useCallback } from 'react';
import { CanvasInlineButton } from '../../ButtonHandle/CanvasInlineButton';

export interface SequentialInsertButtonProps {
  /** Center point in flow coordinates (the connector midpoint). */
  point: XYPosition;
  /** Accessible label, already localized. */
  label: string;
  /** Invoked on click; opens the Add Node panel for the connector's slot. */
  onInsert: () => void;
}

/**
 * Statically centered ⊕ affordance for a sequential connector (design mode
 * only; the caller gates on slot presence + mode). It stays in the DOM for
 * keyboard navigation but is visually revealed on hover/focus, avoiding a wall
 * of competing plus buttons when several nested insertion slots are nearby.
 * Unlike the
 * hover-following EdgeToolbar (see Toolbar/EdgeToolbar/useEdgeToolbarPositioning.ts),
 * this sits at a fixed point on the connector and never tracks the pointer.
 *
 * It stops mousedown/click propagation so opening the Add Node panel does not
 * trip the Toolbox's outside-mousedown close (components/Toolbox/Toolbox.tsx:621-625).
 */
export function SequentialInsertButton({ point, label, onInsert }: SequentialInsertButtonProps) {
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
      >
        <CanvasInlineButton
          aria-label={label}
          icon="plus"
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          onMouseDown={stopMouseDown}
          onClick={handleClick}
        />
      </div>
    </EdgeLabelRenderer>
  );
}
