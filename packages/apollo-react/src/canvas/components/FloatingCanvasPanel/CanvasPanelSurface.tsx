import { cn } from '@uipath/apollo-wind';
import { type CSSProperties, forwardRef, type PointerEventHandler } from 'react';
import { PanelChrome, type PanelChromeProps } from './PanelChrome';

// Surface and typography shared by every panel variant, pinned or floating.
const PANEL_SURFACE_CLASS =
  'text-(--canvas-foreground) bg-(--canvas-background-raised) border border-(--canvas-border-de-emp) text-sm';

// The rounded, shadowed shell of an unpinned panel. Future themes round it a
// step further than the fields inside it (`future:rounded-xl`) so the shell
// still reads as the outer container; `PanelChrome`'s header mirrors this
// radius on its top corners.
const PANEL_SHELL_CLASS = 'rounded-lg future:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)]';

/**
 * Width/height envelope of an unpinned panel: content-sized between a 280px
 * floor and the 600px height ceiling.
 *
 * `w-auto` shrink-to-fits only because {@link FloatingCanvasPanel} positions
 * the panel absolutely. A caller rendering the surface in normal flow has to
 * override the width (`w-fit`, or a fixed one) or it will fill its parent.
 */
export const CANVAS_PANEL_FLOATING_SIZE_CLASS =
  'w-auto min-w-[280px] max-w-none h-auto max-h-[600px]';

// Pinned panels sit flush against the viewport edge, so they drop the radius
// and shadow and take a fixed width.
const PANEL_PINNED_CLASS =
  'rounded-none shadow-none w-[320px] min-w-[320px] max-w-[320px] h-screen max-h-screen';

export interface CanvasPanelSurfaceProps extends PanelChromeProps {
  /** Renders flush to the viewport edge: square corners, no shadow, fixed width. */
  isPinned?: boolean;
  /** Positioning and sizing overrides. The chrome itself is not configurable. */
  className?: string;
  style?: CSSProperties;
  onPointerEnter?: PointerEventHandler<HTMLDivElement>;
  onPointerLeave?: PointerEventHandler<HTMLDivElement>;
}

/**
 * A canvas panel's shell and chrome, with no positioning of its own.
 *
 * {@link FloatingCanvasPanel} wraps this in floating-ui positioning and a
 * portal, which is what a consumer gets.
 *
 * This component is decomposed so the shell and chrome can be used/tested
 * independently of the floating positioning logic.
 *
 * ```tsx
 * <CanvasPanelSurface className="mx-auto w-fit" scrollableContent={false}>
 *   <AddNodePanel … />
 * </CanvasPanelSurface>
 * ```
 */
export const CanvasPanelSurface = forwardRef<HTMLDivElement, CanvasPanelSurfaceProps>(
  function CanvasPanelSurface(
    { isPinned = false, className, style, onPointerEnter, onPointerLeave, ...chromeProps },
    ref
  ) {
    return (
      <div
        ref={ref}
        data-slot="canvas-panel-surface"
        className={cn(
          PANEL_SURFACE_CLASS,
          'flex flex-col transition-opacity duration-200 ease-in-out',
          isPinned
            ? PANEL_PINNED_CLASS
            : `${PANEL_SHELL_CLASS} ${CANVAS_PANEL_FLOATING_SIZE_CLASS}`,
          className
        )}
        style={style}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <PanelChrome {...chromeProps} />
      </div>
    );
  }
);
