import React from "react";
import styled from "@emotion/styled";
import { Panel, type ReactFlowState, useReactFlow, useStore } from "@uipath/uix-xyflow/react";
import { shallow } from "zustand/shallow";

// The minimum distance the mouse must move to consider it a drag attempt
const MIN_DRAG_DISTANCE = 5;

// Consider it an attempt to pan if the user drags twice within 2 seconds
const DOUBLE_DRAG_DURATION_IN_MS = 2000;

// Hide after 3 seconds
const AUTO_HIDE_MESSAGE_DURATION_IN_MS = 3000;

const userSelectionStateSelector = (s: ReactFlowState) => {
  const hasSelectedNodes = s.nodes.some((node) => node.selected);
  const hasSelectedEdges = s.edges.some((edge) => edge.selected);
  const hasSelection = hasSelectedNodes || hasSelectedEdges;

  return {
    hasSelection,
    isPanning: s.paneDragging,
  };
};

interface PanShortcutTeachingUIProps {
  /**
   * Custom message to display in the teaching UI.
   * Defaults to "Hold the Space bar and drag to pan the canvas"
   */
  message?: string;
}

const PanShortcutTeachingUIMessage = styled.div`
  background-color: var(--color-background-inverse);
  padding: 8px 8px;
  border-radius: 4px;
  box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.1);

  opacity: 0;
  transform: translateY(4px);
  transition:
    all 0.2s,
    background-color 0.1s;

  display: flex;
  align-items: center;
  gap: 8px;

  &.shown {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledNonClickablePanel = styled(Panel)`
  pointer-events: none !important;
`;

function PanShortcutTeachingUIInternal({ message = "Hold the Space bar and drag to pan the canvas" }: PanShortcutTeachingUIProps) {
  const { hasSelection, isPanning } = useStore(userSelectionStateSelector, shallow);
  const reactFlowInstance = useReactFlow();

  const [showTeachingUI, setShowTeachingUI] = React.useState(false);
  const showTeachingUIRef = React.useRef(false);
  showTeachingUIRef.current = showTeachingUI;

  // Track drag attempts
  const isDraggingRef = React.useRef(false);
  const dragStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const lastDragTimeRef = React.useRef<number>(0);
  const dragAttemptsCountRef = React.useRef<number>(0);
  const autoHideMessageTimeoutRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    // Use document.body as the event container - this works universally
    // across both regular DOM (frontend) and Shadow DOM (frontend-sw) contexts
    // because mouse events bubble up through Shadow DOM boundaries
    const eventContainer = document.body;

    const handleMouseDown = (event: MouseEvent) => {
      // Only track clicks on the pane (not on nodes)
      const target = event.target as HTMLElement;
      if (target.closest(".react-flow__node") || target.closest(".react-flow__edge")) {
        return;
      }

      isDraggingRef.current = true;
      dragStartPosRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartPosRef.current) return;

      const deltaX = Math.abs(event.clientX - dragStartPosRef.current.x);
      const deltaY = Math.abs(event.clientY - dragStartPosRef.current.y);
      const distance = Math.hypot(deltaX, deltaY);

      // If user moved mouse enough, it's a drag attempt
      if (distance > MIN_DRAG_DISTANCE) {
        // This is a drag attempt, but since selection is disabled, nothing happens
        // We'll handle this in mouseup
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartPosRef.current) {
        isDraggingRef.current = false;
        dragStartPosRef.current = null;
        return;
      }

      const deltaX = Math.abs(event.clientX - dragStartPosRef.current.x);
      const deltaY = Math.abs(event.clientY - dragStartPosRef.current.y);
      const distance = Math.hypot(deltaX, deltaY);

      // Reset drag state
      isDraggingRef.current = false;
      dragStartPosRef.current = null;

      // If this was a significant drag attempt on the pane
      // We ignore hasSelection because timeline player can cause selections
      if (distance > MIN_DRAG_DISTANCE) {
        const now = Date.now();
        const timeSinceLastDrag = now - lastDragTimeRef.current;
        lastDragTimeRef.current = now;

        // Reset counter if more than 2 seconds between drags
        if (timeSinceLastDrag > DOUBLE_DRAG_DURATION_IN_MS) {
          dragAttemptsCountRef.current = 1;
        } else {
          // Increase the counter
          dragAttemptsCountRef.current += 1;

          // Check if it's the second drag attempt in a row
          if (dragAttemptsCountRef.current === 2) {
            setShowTeachingUI(true);

            // Reset the counter
            dragAttemptsCountRef.current = 0;

            // Clear the previous timeout if it exists
            window.clearTimeout(autoHideMessageTimeoutRef.current);

            // Set a new timeout to hide the teaching UI after 3 seconds
            autoHideMessageTimeoutRef.current = window.setTimeout(() => {
              setShowTeachingUI(false);
            }, AUTO_HIDE_MESSAGE_DURATION_IN_MS);
          }
        }
      }
    };

    // Add event listeners to the event container
    eventContainer.addEventListener("mousedown", handleMouseDown as EventListener);
    eventContainer.addEventListener("mousemove", handleMouseMove as EventListener);
    eventContainer.addEventListener("mouseup", handleMouseUp as EventListener);

    return () => {
      eventContainer.removeEventListener("mousedown", handleMouseDown as EventListener);
      eventContainer.removeEventListener("mousemove", handleMouseMove as EventListener);
      eventContainer.removeEventListener("mouseup", handleMouseUp as EventListener);
    };
  }, [reactFlowInstance, hasSelection]);

  React.useEffect(() => {
    if (isPanning && showTeachingUIRef.current) {
      // Hide the teaching UI if the user starts panning
      setShowTeachingUI(false);

      // Clear the previous timeout if it exists
      window.clearTimeout(autoHideMessageTimeoutRef.current);
    }
  }, [isPanning]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(autoHideMessageTimeoutRef.current);
    };
  }, []);

  return (
    <StyledNonClickablePanel position="bottom-center">
      <PanShortcutTeachingUIMessage className={showTeachingUI ? "shown" : ""}>
        <span
          style={{
            display: "inline-flex",
            color: "var(--color-foreground-inverse)",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          {message}
        </span>
      </PanShortcutTeachingUIMessage>
    </StyledNonClickablePanel>
  );
}

export const PanShortcutTeachingUI = React.memo(PanShortcutTeachingUIInternal);
