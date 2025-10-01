import { memo, useCallback } from "react";
import { useReactFlow } from "@uipath/uix/xyflow/react";
import { ApIcon, ApIconButton, ApTooltip } from "@uipath/portal-shell-react";
import { Column, Row } from "@uipath/uix/core";
import { BASE_CANVAS_DEFAULTS } from "./BaseCanvas/BaseCanvas.constants";

export interface CanvasPositionControlsProps {
  orientation?: "horizontal" | "vertical";
}

export const CanvasPositionControls = memo(({ orientation = "horizontal" }: CanvasPositionControlsProps) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => zoomIn(), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut(), [zoomOut]);
  const handleFitToView = useCallback(() => fitView(BASE_CANVAS_DEFAULTS.fitViewOptions), [fitView]);

  let RootComponent: React.ElementType = Column;
  let placement: "left" | "top" = "left";
  if (orientation === "horizontal") {
    RootComponent = Row;
    placement = "top";
  }

  // TODO: Localize
  return (
    <RootComponent data-testid="canvas-controls">
      <ApTooltip content={"Zoom in"} placement={placement} data-testid="zoom-in-button">
        <ApIconButton color="secondary" onClick={handleZoomIn}>
          <ApIcon name="add" />
        </ApIconButton>
      </ApTooltip>
      <ApTooltip content={"Zoom out"} placement={placement} data-testid="zoom-out-button">
        <ApIconButton color="secondary" onClick={handleZoomOut}>
          <ApIcon name="remove" />
        </ApIconButton>
      </ApTooltip>
      <ApTooltip content={"Fit to view"} placement={placement} data-testid="fit-to-view-button">
        <ApIconButton color="secondary" onClick={handleFitToView}>
          <ApIcon name="filter_center_focus" />
        </ApIconButton>
      </ApTooltip>
    </RootComponent>
  );
});
