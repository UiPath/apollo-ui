import React, { type ReactNode } from "react";
import { ViewportPortal } from "@uipath/uix/xyflow/react";
import { type Placement } from "@floating-ui/react";
import { CanvasPortal } from "./CanvasPortal";
import { PanelChrome } from "./PanelChrome";
import { useFloatingPosition, type AnchorRect } from "./useFloatingPosition";
import styled from "@emotion/styled";

const PanelContainer = styled.div`
  color: var(--color-foreground);
  background-color: var(--color-background);
  border: 1px solid var(--color-border-de-emp);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 14px;
  min-width: 280px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s ease-in-out;
`;

export type FloatingCanvasPanelProps = {
  // Anchor/floating
  open?: boolean;
  nodeId?: string;
  anchorRect?: AnchorRect;
  placement?: Placement;
  offset?: number;

  // Header/content
  title?: ReactNode;
  header?: ReactNode;
  headerActions?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  scrollKey?: string;
};

export function FloatingCanvasPanel({
  open = true,
  nodeId,
  anchorRect,
  placement = "right-start",
  offset = 20,
  title,
  header,
  headerActions,
  children,
  onClose,
  scrollKey,
}: FloatingCanvasPanelProps) {
  const { computedAnchor, floatingStyles, refs, mergedReferenceRef } = useFloatingPosition({
    open,
    nodeId,
    anchorRect,
    placement,
    offset,
  });

  if (!open || !computedAnchor) return null;

  return (
    <>
      <ViewportPortal>
        <div
          ref={mergedReferenceRef}
          style={{
            position: "absolute",
            width: computedAnchor.width,
            height: computedAnchor.height,
            transform: `translate(${computedAnchor.x}px, ${computedAnchor.y}px)`,
            pointerEvents: "none",
            background: "none",
          }}
        />
      </ViewportPortal>

      <CanvasPortal>
        <PanelContainer
          ref={refs.setFloating}
          className="nodrag nopan nowheel"
          style={{
            ...floatingStyles,
            position: "absolute",
            zIndex: 10000,
            pointerEvents: "auto",
          }}
        >
          <PanelChrome title={title} header={header} headerActions={headerActions} onClose={onClose} scrollKey={scrollKey}>
            {children}
          </PanelChrome>
        </PanelContainer>
      </CanvasPortal>
    </>
  );
}
