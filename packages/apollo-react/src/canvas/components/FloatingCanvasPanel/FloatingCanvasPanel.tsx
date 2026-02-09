import styled from '@emotion/styled';
import type { Placement } from '@floating-ui/react';
import { ViewportPortal } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CanvasPortal } from './CanvasPortal';
import { PanelChrome } from './PanelChrome';
import { type AnchorRect, useFloatingPosition } from './useFloatingPosition';

const PanelContainer = styled.div<{ isPinned?: boolean }>`
  color: var(--uix-canvas-foreground);
  background-color: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-de-emp);
  border-radius: ${(props) => (props.isPinned ? '0' : '8px')};
  box-shadow: ${(props) => (props.isPinned ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.12)')};
  font-size: 14px;
  min-width: ${(props) => (props.isPinned ? '320px' : '280px')};
  max-width: ${(props) => (props.isPinned ? '320px' : 'none')};
  width: ${(props) => (props.isPinned ? '320px' : 'auto')};
  height: ${(props) => (props.isPinned ? '100vh' : 'auto')};
  max-height: ${(props) => (props.isPinned ? '100vh' : '600px')};
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s ease-in-out;
  border-left: ${(props) =>
    props.isPinned ? '1px solid var(--uix-canvas-border-de-emp)' : 'none'};
`;

export type FloatingCanvasPanelProps = {
  // Anchor/floating
  open?: boolean;
  nodeId?: string;
  anchorRect?: AnchorRect;
  placement?: Placement;
  offset?: number;
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
  });

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
      <PanelContainer
        className="nodrag nopan nowheel"
        isPinned={isPinned}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'fixed',
          ...screenPosition,
          zIndex: 10000,
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
      </PanelContainer>
    );

    return portalToBody ? (
      createPortal(fixedContent, document.body)
    ) : (
      <CanvasPortal>{fixedContent}</CanvasPortal>
    );
  }

  const panelContent = (
    <PanelContainer
      ref={refs.setFloating}
      className="nodrag nopan nowheel"
      isPinned={isPinned}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...(isPinned ? {} : floatingStyles),
        position: isPinned ? 'fixed' : 'absolute',
        right: isPinned ? 0 : undefined,
        top: isPinned ? 0 : undefined,
        zIndex: 10000,
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
    </PanelContainer>
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
