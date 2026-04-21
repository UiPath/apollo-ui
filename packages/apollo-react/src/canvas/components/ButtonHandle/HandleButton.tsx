import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { cx } from '../../utils/CssUtil';
import { CanvasInlineButton } from './CanvasInlineButton';

const BUTTON_POSITION: Record<Position, string> = {
  [Position.Top]: 'flex-col-reverse bottom-full left-1/2 -translate-x-1/2',
  [Position.Bottom]: 'flex-col top-full left-1/2 -translate-x-1/2',
  [Position.Left]: 'flex-row-reverse right-full top-1/2 -translate-y-1/2',
  [Position.Right]: 'flex-row left-full top-1/2 -translate-y-1/2',
};
const DRAG_THRESHOLD = 5; // px — movement before a click becomes a drag
/**
 * HandleButton — the "+" button on source handles (apollo-wind Button)
 *  Click → fires onAction.
 *  Drag  → forwards pointerdown to the parent .react-flow__handle so React
 *          Flow starts a connection drag.  React Flow normally ignores events
 *          from <button> elements and .nodrag descendants, so we dispatch a
 *          synthetic event directly on the Handle once a drag threshold is met.
 */
export const HandleButton = memo(
  ({
    visible,
    labelVisible,
    position,
    onAction,
    handleRef,
    label,
    labelIcon,
    labelBackgroundColor,
  }: {
    visible?: boolean;
    labelVisible?: boolean;
    position: Position;
    onAction: (event: React.MouseEvent) => void;
    handleRef?: React.RefObject<HTMLDivElement | null>;
    label?: string;
    labelIcon?: React.ReactNode;
    labelBackgroundColor?: string;
  }) => {
    const didDragRef = useRef(false);
    const teardownRef = useRef<(() => void) | null>(null);

    // Clean up document listeners if the component unmounts mid-drag
    useEffect(() => () => teardownRef.current?.(), []);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        // Suppress the click if it was actually a drag-to-connect gesture
        if (didDragRef.current) return;
        onAction(e);
      },
      [onAction]
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: handleRef is a stable ref object — reading .current inside the callback is correct
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      // Tear down any leftover listeners from a prior pointer sequence
      teardownRef.current?.();

      didDragRef.current = false;

      const startX = e.clientX;
      const startY = e.clientY;
      const onMove = (moveEvt: PointerEvent) => {
        if (didDragRef.current) return; // already forwarded
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;

        didDragRef.current = true;

        // React Flow's Handle binds its connection-start logic to onMouseDown
        // (which internally calls XYHandle.onPointerDown). Dispatch a synthetic
        // mousedown on the Handle element so React Flow starts the connection.
        const handleEl = handleRef?.current;
        if (handleEl) {
          const rect = handleEl.getBoundingClientRect();
          handleEl.dispatchEvent(
            new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            })
          );
        }
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', cleanup);
        document.removeEventListener('pointercancel', cleanup);
        teardownRef.current = null;
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', cleanup);
      document.addEventListener('pointercancel', cleanup);
      teardownRef.current = cleanup;
    }, []);

    return (
      <div
        className={cx(
          'absolute flex items-center gap-1 pointer-events-none',
          BUTTON_POSITION[position]
        )}
      >
        {visible && (
          <CanvasInlineButton
            aria-label="Add node"
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            className="nodrag nopan pointer-events-auto animate-fade-in"
          />
        )}
        {label && (
          <InlineLabel
            label={label}
            labelIcon={labelIcon}
            backgroundColor={labelBackgroundColor}
            visible={labelVisible}
          />
        )}
      </div>
    );
  }
);

const InlineLabel = ({
  label,
  labelIcon,
  backgroundColor,
  visible = true,
}: {
  label: string;
  labelIcon?: React.ReactNode;
  backgroundColor?: string;
  visible?: boolean;
}) => (
  <div
    className={cx(
      'px-1.5 py-0.5 rounded-sm whitespace-nowrap select-none transition-opacity duration-250',
      visible ? 'opacity-100' : 'opacity-0'
    )}
    style={backgroundColor ? { backgroundColor } : undefined}
  >
    <Row align="center" gap={4}>
      {labelIcon}
      <span className="text-xs font-bold text-foreground-muted">{label}</span>
    </Row>
  </div>
);

const BRIDGE_BASE = 'absolute pointer-events-auto cursor-default';
const BRIDGE_POSITION: Record<Position, string> = {
  [Position.Top]: 'bottom-full left-0 w-full',
  [Position.Bottom]: 'top-full left-0 w-full',
  [Position.Left]: 'right-full top-0 h-full',
  [Position.Right]: 'left-full top-0 h-full',
};
/**
 * Invisible bridge to cover gaps between handle buttons preventing flickering when moving the pointer between them.
 */
export const HandleHoverBridge = memo(
  ({ position, visible }: { position: Position; visible?: boolean }) => {
    if (!visible) return null;
    const isVertical = position === Position.Top || position === Position.Bottom;
    return (
      <div className={cx(BRIDGE_BASE, BRIDGE_POSITION[position], isVertical ? 'h-14' : 'w-14')} />
    );
  }
);
