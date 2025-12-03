import React, { type ReactNode } from "react";
import { ViewportPortal } from "@uipath/uix/xyflow/react";
import { type Placement } from "@floating-ui/react";
import { CanvasPortal } from "./CanvasPortal";
import { PanelChrome } from "./PanelChrome";
import { useFloatingPosition, type AnchorRect } from "./useFloatingPosition";
import styled from "@emotion/styled";

const PanelContainer = styled.div<{ isPinned?: boolean }>`
  color: var(--uix-canvas-foreground);
  background-color: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-de-emp);
  border-radius: ${(props) => (props.isPinned ? "0" : "8px")};
  box-shadow: ${(props) => (props.isPinned ? "none" : "0 4px 16px rgba(0, 0, 0, 0.12)")};
  font-size: 14px;
  min-width: ${(props) => (props.isPinned ? "320px" : "280px")};
  max-width: ${(props) => (props.isPinned ? "320px" : "none")};
  width: ${(props) => (props.isPinned ? "320px" : "auto")};
  height: ${(props) => (props.isPinned ? "100vh" : "auto")};
  max-height: ${(props) => (props.isPinned ? "100vh" : "600px")};
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s ease-in-out;
  border-left: ${(props) => (props.isPinned ? "1px solid var(--uix-canvas-border-de-emp)" : "none")};
`;

export type FloatingCanvasPanelProps = {
  // Anchor/floating
  open?: boolean;
  nodeId?: string;
  anchorRect?: AnchorRect;
  placement?: Placement;
  offset?: number;
  isPinned?: boolean;

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
  isPinned = false,
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
          isPinned={isPinned}
          style={{
            ...(isPinned ? {} : floatingStyles),
            position: isPinned ? "fixed" : "absolute",
            right: isPinned ? 0 : undefined,
            top: isPinned ? 0 : undefined,
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
