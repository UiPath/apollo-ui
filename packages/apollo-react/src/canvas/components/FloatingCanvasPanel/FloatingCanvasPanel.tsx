import type { Placement } from '@floating-ui/react';
import { ViewportPortal } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CanvasPortal } from './CanvasPortal';
import { PanelChrome } from './PanelChrome';
import { type AnchorRect, useFloatingPosition } from './useFloatingPosition';

const PANEL_BASE_CLASS =
  'text-(--canvas-foreground) bg-(--canvas-background-raised) border border-(--canvas-border-de-emp) text-sm flex flex-col transition-opacity duration-200 ease-in-out';

const PANEL_FLOATING_CLASS =
  'rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] w-auto min-w-[280px] max-w-none h-auto max-h-[600px]';

const PANEL_PINNED_CLASS =
  'rounded-none shadow-none w-[320px] min-w-[320px] max-w-[320px] h-screen max-h-screen';

export type FloatingCanvasPanelProps = {
  // Anchor/floating
  open?: boolean;
  nodeId?: string;
  anchorRect?: AnchorRect;
  placement?: Placement;
  offset?: number;
  /**
   * Controls whether the panel should try fallback placements when the primary
   * axis overflows in both directions (e.g. both top and bottom are out of bounds).
   * - `'none'` (default): only flip on the main axis (e.g. bottom↔top)
   * - `'start'`: fall back to the start of the cross axis (e.g. left in LTR)
   * - `'end'`: fall back to the end of the cross axis (e.g. right in LTR)
   * @see https://floating-ui.com/docs/flip#fallbackaxissidedirection
   */
  fallbackPlacement?: 'none' | 'start' | 'end';
  isPinned?: boolean;
  /**
   * When true, the panel uses fixed positioning and anchorRect is treated as screen-space
   * coordinates (e.g., from getBoundingClientRect). When false (default), the panel uses
   * flow-space coordinates that respect canvas zoom/pan.
   * This is useful when anchoring to elements outside the canvas (like toolbar buttons).
   */
  useFixedPosition?: boolean;
  /**
   * When true, renders the panel to document.body instead of the canvas portal.
   * This ensures the panel appears above all other UI elements (toolbars, overlays, etc.)
   * even when using flow-space positioning with nodeId.
   */
  portalToBody?: boolean;

  // Header/content
  title?: ReactNode;
  header?: ReactNode;
  headerActions?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  scrollKey?: string;

  // Mouse events for hover persistence
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function FloatingCanvasPanel({
  open = true,
  nodeId,
  anchorRect,
  placement = 'right-start',
  offset = 20,
  fallbackPlacement,
  isPinned = false,
  useFixedPosition = false,
  portalToBody = false,
  title,
  header,
  headerActions,
  children,
  onClose,
  scrollKey,
  onMouseEnter,
  onMouseLeave,
}: FloatingCanvasPanelProps) {
  const { computedAnchor, floatingStyles, refs, mergedReferenceRef } = useFloatingPosition({
    open,
    nodeId,
    anchorRect,
    placement,
    offset,
    fallbackPlacement,
  });

  const panelClassName = useMemo(
    () => cn(PANEL_BASE_CLASS, isPinned ? PANEL_PINNED_CLASS : PANEL_FLOATING_CLASS),
    [isPinned]
  );

  if (!open || !computedAnchor) return null;

  if (useFixedPosition && anchorRect) {
    const getScreenSpacePosition = () => {
      const anchorCenterX = computedAnchor.x + computedAnchor.width / 2;

      switch (placement) {
        case 'top':
        case 'top-start':
        case 'top-end':
          return {
            left: anchorCenterX,
            bottom: window.innerHeight - computedAnchor.y + offset,
            transform: 'translateX(-50%)',
          };
        case 'bottom':
        case 'bottom-start':
        case 'bottom-end':
          return {
            left: anchorCenterX,
            top: computedAnchor.y + computedAnchor.height + offset,
            transform: 'translateX(-50%)',
          };
        case 'right':
        case 'right-start':
        case 'right-end':
          return {
            left: computedAnchor.x + computedAnchor.width + offset,
            top: computedAnchor.y,
          };
        case 'left':
        case 'left-start':
        case 'left-end':
          return {
            right: window.innerWidth - computedAnchor.x + offset,
            top: computedAnchor.y,
          };
        default:
          return {
            left: anchorCenterX,
            bottom: window.innerHeight - computedAnchor.y + offset,
            transform: 'translateX(-50%)',
          };
      }
    };

    const screenPosition = getScreenSpacePosition();

    const fixedContent = (
      <div
        className={cn('nodrag nopan nowheel', panelClassName)}
        onPointerEnter={onMouseEnter}
        onPointerLeave={onMouseLeave}
        style={{
          position: 'fixed',
          ...screenPosition,
          zIndex: 1100,
          pointerEvents: 'auto',
        }}
      >
        <PanelChrome
          title={title}
          header={header}
          headerActions={headerActions}
          onClose={onClose}
          scrollKey={scrollKey}
        >
          {children}
        </PanelChrome>
      </div>
    );

    return portalToBody ? (
      createPortal(fixedContent, document.body)
    ) : (
      <CanvasPortal>{fixedContent}</CanvasPortal>
    );
  }

  const panelContent = (
    <div
      ref={refs.setFloating}
      className={cn('nodrag nopan nowheel', panelClassName)}
      onPointerEnter={onMouseEnter}
      onPointerLeave={onMouseLeave}
      style={{
        ...(isPinned ? {} : floatingStyles),
        position: isPinned ? 'fixed' : 'absolute',
        right: isPinned ? 0 : undefined,
        top: isPinned ? 0 : undefined,
        zIndex: 1100,
        pointerEvents: 'auto',
      }}
    >
      <PanelChrome
        title={title}
        header={header}
        headerActions={headerActions}
        onClose={onClose}
        scrollKey={scrollKey}
      >
        {children}
      </PanelChrome>
    </div>
  );

  return (
    <>
      <ViewportPortal>
        <div
          ref={mergedReferenceRef}
          style={{
            position: 'absolute',
            width: computedAnchor.width,
            height: computedAnchor.height,
            transform: `translate(${computedAnchor.x}px, ${computedAnchor.y}px)`,
            pointerEvents: 'none',
            background: 'none',
          }}
        />
      </ViewportPortal>

      {portalToBody ? (
        createPortal(panelContent, document.body)
      ) : (
        <CanvasPortal>{panelContent}</CanvasPortal>
      )}
    </>
  );
}
