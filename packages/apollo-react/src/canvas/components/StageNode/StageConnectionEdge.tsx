import React from "react";
import type { ConnectionLineComponentProps } from "@uipath/uix/xyflow/react";
import { getBezierPath } from "@uipath/uix/xyflow/react";

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

export function StageConnectionEdge({ fromX, fromY, toX, toY, fromPosition, toPosition, fromNode, toNode }: ConnectionLineComponentProps) {
  // Check if we have valid coordinates
  if (fromX === undefined || fromY === undefined || toX === undefined || toY === undefined) {
    return null;
  }

  const sourceX = fromNode ? fromNode.position.x + (fromNode.measured?.width ?? 0) : fromX;
  const sourceY = fromNode?.position.y ? fromNode.position.y + 32 : fromY;

  const targetX = toNode ? toNode.position.x : toX;
  const targetY = toNode ? toNode.position.y + 32 : toY;

  const [pathData] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: fromPosition,
    targetX,
    targetY,
    targetPosition: toPosition,
  });

  const stroke = "var(--color-selection-indicator)";
  const strokeWidth = 2.5;
  const arrowSize = 10;

  const { endX, endY, angle } = getArrowFromBezier(pathData, arrowSize);
  const arrowLineLength = arrowSize;

  return (
    <g className="animated">
      <path
        d={pathData}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="5,5"
        style={{
          animation: "dashdraw 0.5s linear infinite",
        }}
      />
      <style>
        {`
          @keyframes dashdraw {
            0% {
              stroke-dashoffset: 10;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
      <line
        x1={endX}
        y1={endY}
        x2={endX - arrowLineLength * Math.cos(angle - Math.PI / 6)}
        y2={endY - arrowLineLength * Math.sin(angle - Math.PI / 6)}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        x1={endX}
        y1={endY}
        x2={endX - arrowLineLength * Math.cos(angle + Math.PI / 6)}
        y2={endY - arrowLineLength * Math.sin(angle + Math.PI / 6)}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}
