import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { HANDLE_DRAG_THRESHOLD } from '../../constants';
import { cx } from '../../utils/CssUtil';
import { NodeViewportOverlay } from '../NodeViewportOverlay';
import { CanvasInlineButton } from './CanvasInlineButton';
import { LABEL_SHADOW_STYLE } from './HandleLabel';

const BUTTON_POSITION: Record<Position, string> = {
  [Position.Top]: 'flex-col-reverse bottom-full left-1/2 -translate-x-1/2',
  [Position.Bottom]: 'flex-col top-full left-1/2 -translate-x-1/2',
  [Position.Left]: 'flex-row-reverse right-full top-1/2 -translate-y-1/2',
  [Position.Right]: 'flex-row left-full top-1/2 -translate-y-1/2',
};

// How far the button is pulled in from the handle's outer edge (12px off the node). Its inner
// edge stays there in both sizes, so it grows outward. `rounded` sits 2px off the node; `circle`
// is centred on the node's edge when small, where the notch would be.
const ANCHOR_INSET_PX = { rounded: 10, circle: 20 } as const;
// Half of a `ButtonHandle`'s 24px cross-axis: how far its box reaches outside the node.
const HANDLE_REACH_PX = 12;
const ANCHOR_MARGIN: Record<Position, 'marginBottom' | 'marginTop' | 'marginRight' | 'marginLeft'> =
  {
    [Position.Top]: 'marginBottom',
    [Position.Bottom]: 'marginTop',
    [Position.Left]: 'marginRight',
    [Position.Right]: 'marginLeft',
  };
// The side facing the node, so a scaled button grows away from it.
const SCALE_ORIGIN: Record<Position, string> = {
  [Position.Top]: 'center bottom',
  [Position.Bottom]: 'center top',
  [Position.Left]: 'right center',
  [Position.Right]: 'left center',
};
const SIZE_TRANSITION =
  '[transition:width_120ms_ease,height_120ms_ease,border-radius_120ms_ease,opacity_120ms_ease,color_120ms_ease,background-color_120ms_ease,border-color_120ms_ease]';

export type HandleButtonPortal = {
  nodeId: string;
  left: number;
  top: number;
  width: number;
  height: number;
  transform: string;
};

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
    keepButtonMounted = false,
    position,
    onAction,
    onMouseEnter,
    onMouseLeave,
    handleRef,
    label,
    labelIcon,
    labelBackgroundColor,
    renderLabel = true,
    portal,
    title,
    testId,
    buttonClassName,
    outset = 0,
    scale = 1,
    compact,
    shape = 'rounded',
    edgeOffset = HANDLE_REACH_PX,
  }: {
    visible?: boolean;
    labelVisible?: boolean;
    /**
     * Keep the add button mounted and toggle its opacity via `visible` instead of
     * conditionally rendering it. This reserves the button's slot in the flex
     * stack so the label never reflows/jumps when the button appears or hides.
     */
    keepButtonMounted?: boolean;
    position: Position;
    onAction: (event: React.MouseEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    handleRef?: React.RefObject<HTMLDivElement | null>;
    /** Single source of truth for both the accessible name (`Add node from {label} handle`) and, when `renderLabel` is true, the visual `InlineLabel` text. */
    label?: string;
    labelIcon?: React.ReactNode;
    labelBackgroundColor?: string;
    /**
     * Set to `false` when a caller already renders its own adjacent visual label for
     * `label` (e.g. inward handles via `InwardHandleContent`), so this button's own
     * `InlineLabel` doesn't duplicate it. `label` still drives the accessible name
     * either way — this only controls the visual copy.
     */
    renderLabel?: boolean;
    portal?: HandleButtonPortal;
    /** Native tooltip for the add button. The accessible name stays `label`-driven. */
    title?: string;
    /** `data-testid` for the add button. */
    testId?: string;
    /** Appended to the add button's own classes. */
    buttonClassName?: string;
    /** With `compact` set: moves the button this many px further out from the node. */
    outset?: number;
    /** Scales the button and its label, growing away from the node. Defaults to 1. */
    scale?: number;
    /**
     * Set to make the button stand in for the handle, anchored against the node: `true` small,
     * `false` full size. Leave undefined for the default button beyond the handle.
     */
    compact?: boolean;
    /** Only applies when `compact` is set. */
    shape?: 'rounded' | 'circle';
    /**
     * With `compact` set: how far outside the node the positioned parent ends. Defaults to the
     * 12px a `ButtonHandle` reaches; pass 0 when the parent ends at the node's edge, as a host's
     * own handle may.
     */
    edgeOffset?: number;
  }) => {
    const accessibleName = label ? `Add node from ${label} handle` : 'Add node';
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
        if (dx * dx + dy * dy < HANDLE_DRAG_THRESHOLD * HANDLE_DRAG_THRESHOLD) return;

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
          // Clear the source node's hover state so handles hide after the
          // connection drag ends.  Dragging from the notch fires mouseleave
          // naturally; here it doesn't because the pointer originated on the
          // button.  A synthetic mouseout bubbles up to BaseNode's onMouseLeave.
          handleEl.dispatchEvent(
            new MouseEvent('mouseout', {
              bubbles: true,
              relatedTarget: document.body,
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

    const addButton = keepButtonMounted ? (
      // Always mounted: toggle opacity so the slot is reserved and the label never reflows.
      // When not visible, disable it (non-focusable, non-interactive) and hide it from the
      // accessibility tree so neither keyboard nor assistive tech reaches an invisible button.
      // `disabled:opacity-0` overrides the button's default `disabled:opacity-50`.
      <CanvasInlineButton
        aria-label={accessibleName}
        title={title}
        data-testid={testId}
        aria-hidden={visible ? undefined : true}
        disabled={visible ? undefined : true}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cx(
          'nodrag nopan transition-opacity duration-250',
          visible
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0 disabled:opacity-0',
          buttonClassName
        )}
      />
    ) : (
      visible && (
        <CanvasInlineButton
          aria-label={accessibleName}
          title={title}
          data-testid={testId}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          iconSize={compact ? 10 : undefined}
          className={cx(
            'nodrag nopan pointer-events-auto animate-fade-in',
            compact !== undefined && SIZE_TRANSITION,
            // Button sizes its svg to 16px, which overflows this box and lands off-centre.
            compact && 'h-4 w-4 [&_svg]:size-2.5',
            compact !== undefined && shape === 'circle' ? 'rounded-full' : compact && 'rounded-md',
            buttonClassName
          )}
        />
      )
    );

    const content = (
      <div
        className={cx('absolute flex items-center pointer-events-none', BUTTON_POSITION[position])}
        style={{
          ...(compact !== undefined && {
            [ANCHOR_MARGIN[position]]:
              HANDLE_REACH_PX - edgeOffset - ANCHOR_INSET_PX[shape] + outset,
          }),
          // A string, since React 18 appends `px` to a number here.
          ...(scale !== 1 && { scale: String(scale), transformOrigin: SCALE_ORIGIN[position] }),
        }}
      >
        {addButton}
        {label && renderLabel && (
          <InlineLabel
            label={label}
            labelIcon={labelIcon}
            backgroundColor={labelBackgroundColor}
            visible={labelVisible}
          />
        )}
      </div>
    );

    const shouldRenderPortal = Boolean(
      keepButtonMounted || visible || (label && renderLabel && labelVisible)
    );

    if (portal) {
      if (!shouldRenderPortal) {
        return null;
      }

      const { nodeId, ...anchor } = portal;

      return (
        <NodeViewportOverlay nodeId={nodeId} anchor={anchor} layer="nodeHandleAffordance">
          {content}
        </NodeViewportOverlay>
      );
    }

    return content;
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
    aria-hidden={visible ? undefined : true}
    className={cx(
      'px-1.5 py-0.5 rounded-sm whitespace-nowrap select-none transition-opacity duration-250 z-10',
      visible ? 'opacity-100' : 'opacity-0'
    )}
    style={backgroundColor ? { backgroundColor } : undefined}
  >
    <Row align="center" gap={4}>
      {labelIcon}
      <span
        className="text-xs font-bold text-foreground-muted"
        style={backgroundColor ? undefined : LABEL_SHADOW_STYLE}
      >
        {label}
      </span>
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
  ({
    position,
    visible,
    extent,
  }: {
    position: Position;
    visible?: boolean;
    /** How far the bridge reaches out from the node, in px. Defaults to 60. */
    extent?: number;
  }) => {
    if (!visible) return null;
    const isVertical = position === Position.Top || position === Position.Bottom;
    return (
      <div
        className={cx(
          BRIDGE_BASE,
          BRIDGE_POSITION[position],
          extent === undefined && (isVertical ? 'h-15' : 'w-15')
        )}
        style={extent === undefined ? undefined : { [isVertical ? 'height' : 'width']: extent }}
      />
    );
  }
);
