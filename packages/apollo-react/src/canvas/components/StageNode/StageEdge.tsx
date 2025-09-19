import React from "react";
import type { EdgeProps } from "@uipath/uix/xyflow/react";
import { EdgeLabelRenderer, useInternalNode, getSmoothStepPath } from "@uipath/uix/xyflow/react";
import styled from "@emotion/styled";

export const StageEdgeLabel = styled.div`
  position: absolute;
  color: var(--color-foreground);
  background: var(--color-background);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  pointer-events: all;

  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-border-hover);
  }
`;

type Props = EdgeProps & {
  stroke?: string;
  strokeWidth?: number;
  arrowSize?: number;
};

function getArrowFromBezier(path: string, arrowSize: number) {
  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathEl.setAttribute("d", path);

  const totalLength = pathEl.getTotalLength();
  const endPoint = pathEl.getPointAtLength(totalLength);
  const prevPoint = pathEl.getPointAtLength(totalLength - arrowSize);

  const angle = Math.atan2(endPoint.y - prevPoint.y, endPoint.x - prevPoint.x);
  return {
    endX: endPoint.x,
    endY: endPoint.y,
    angle,
  };
}

export function StageEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style,
  stroke = "var(--color-foreground-emp)",
  strokeWidth = 2,
  arrowSize = 8,
  ...rest
}: Props) {
  const sourceNode = useInternalNode(rest.source);
  const targetNode = useInternalNode(rest.target);

  const sourceNodeX = sourceNode ? sourceNode.position.x + (sourceNode.measured?.width ?? 0) : sourceX;
  const sourceNodeY = sourceNode?.position.y ? sourceNode.position.y + 25 : sourceY;
  const targetNodeX = targetNode?.position.x ?? targetX;
  const targetNodeY = targetNode?.position.y ? targetNode.position.y + 25 : targetY;
  const [pathData, labelX, labelY, _ex, _ey] = getSmoothStepPath({
    sourceX: sourceNodeX,
    sourceY: sourceNodeY,
    sourcePosition,
    targetX: targetNodeX - 1,
    targetY: targetNodeY,
    targetPosition,
    borderRadius: 40,
  });

  const { endX, endY, angle } = getArrowFromBezier(pathData, arrowSize);

  const arrowLineLength = arrowSize;

  const strokeColor = selected ? "var(--color-selection-indicator)" : stroke;
  const strokeWidthValue = selected ? strokeWidth + 1 : strokeWidth;

  return (
    <>
      <g className={`react-flow__edge stage-edge ${selected ? "selected" : ""}`}>
        <path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidthValue}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={style}
        />

        {/* <circle cx={sourceNodeX} cy={sourceNodeY} r={arrowSize / 2} fill={stroke} /> */}

        <line
          x1={endX}
          y1={endY}
          x2={endX - arrowLineLength * Math.cos(angle - Math.PI / 6)}
          y2={endY - arrowLineLength * Math.sin(angle - Math.PI / 6)}
          stroke={strokeColor}
          strokeWidth={strokeWidthValue}
        />
        <line
          x1={endX}
          y1={endY}
          x2={endX - arrowLineLength * Math.cos(angle + Math.PI / 6)}
          y2={endY - arrowLineLength * Math.sin(angle + Math.PI / 6)}
          stroke={strokeColor}
          strokeWidth={strokeWidthValue}
        />

        <path d={pathData} stroke="transparent" strokeWidth={20} fill="none" pointerEvents="stroke" />
      </g>
      {rest.label && (
        <EdgeLabelRenderer>
          <StageEdgeLabel
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="nodrag nopan"
          >
            {rest.label}
          </StageEdgeLabel>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
