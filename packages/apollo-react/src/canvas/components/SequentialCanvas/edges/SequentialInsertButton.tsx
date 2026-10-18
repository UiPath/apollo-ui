import { memo, type MouseEvent as ReactMouseEvent, useCallback, useMemo } from 'react';
import { CanvasInlineButton } from '../../ButtonHandle/CanvasInlineButton';

/** Faint-until-hover treatment shared by every sequential add affordance. */
export const SEQ_INSERT_REST_CLASS =
  'opacity-40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';

export interface SequentialInsertButtonProps {
  /** Connector this button inserts into; handed back to `onInsert`. */
  edgeId: string;
  /** Center point in flow coordinates (the connector midpoint), as primitives so memo holds. */
  x: number;
  y: number;
  /** Accessible label, already localized. */
  label: string;
  /** Invoked on click; opens the Add Node panel for the connector's slot. */
  onInsert: (edgeId: string) => void;
}

/**
 * Fixed-position ⊕ for a sequential connector; faint at rest, full on hover/focus.
 * Rendered inside the canvas-level SequentialInsertLayer portal. Stops mousedown
 * propagation so opening the Add Node panel does not trip the Toolbox's
 * outside-mousedown close.
 */
export const SequentialInsertButton = memo(function SequentialInsertButton({
  edgeId,
  x,
  y,
  label,
  onInsert,
}: SequentialInsertButtonProps) {
  const stopMouseDown = useCallback((event: ReactMouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleClick = useCallback(
    (event: ReactMouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      onInsert(edgeId);
    },
    [onInsert, edgeId]
  );

  const style = useMemo(
    () => ({ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }),
    [x, y]
  );

  return (
    <div
      className="group nodrag nopan absolute top-0 left-0 z-1004 pointer-events-auto"
      style={style}
      onMouseDown={stopMouseDown}
    >
      <CanvasInlineButton
        aria-label={label}
        icon="plus"
        className={SEQ_INSERT_REST_CLASS}
        onMouseDown={stopMouseDown}
        onClick={handleClick}
      />
    </div>
  );
});
