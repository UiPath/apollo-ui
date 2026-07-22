import styled from '@emotion/styled';
import type { EdgeProps, ReactFlowState } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useStore,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo } from 'react';

export const StageEdgeLabel = styled.div`
  position: absolute;
  color: var(--canvas-foreground);
  background: var(--canvas-background, var(--color-background));
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--canvas-border);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  pointer-events: all;

  &:hover {
    background: var(--canvas-background-hover, var(--color-background-hover));
    border-color: var(--canvas-border-hover);
  }
`;

type Props = EdgeProps & {
  stroke?: string;
  strokeWidth?: number;
  arrowSize?: number;
};

interface StageEdgeGeometry {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

interface StageEdgeInnerProps extends Omit<Props, 'sourceX' | 'sourceY' | 'targetX' | 'targetY'> {
  geometry: StageEdgeGeometry;
}

function stageEdgeGeometryEquality(previous: StageEdgeGeometry, next: StageEdgeGeometry): boolean {
  return (
    previous.sourceX === next.sourceX &&
    previous.sourceY === next.sourceY &&
    previous.targetX === next.targetX &&
    previous.targetY === next.targetY
  );
}

function getArrowFromBezier(path: string, arrowSize: number) {
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.setAttribute('d', path);

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

function StageEdgeInner({
  geometry,
  sourcePosition,
  targetPosition,
  selected,
  style,
  stroke = 'var(--canvas-foreground-emp)',
  strokeWidth = 2,
  arrowSize = 8,
  ...rest
}: StageEdgeInnerProps) {
  const [pathData, labelX, labelY, _ex, _ey] = getSmoothStepPath({
    sourceX: geometry.sourceX,
    sourceY: geometry.sourceY,
    sourcePosition,
    targetX: geometry.targetX - 1,
    targetY: geometry.targetY,
    targetPosition,
    borderRadius: 40,
  });

  // getArrowFromBezier creates a detached SVG path and measures it
  // (getTotalLength/getPointAtLength) — memoized so re-renders that don't move
  // the edge (e.g. selection toggles) skip the geometry work.
  const { endX, endY, angle } = useMemo(
    () => getArrowFromBezier(pathData, arrowSize),
    [pathData, arrowSize]
  );

  const arrowLineLength = arrowSize;

  const strokeColor = selected ? 'var(--canvas-selection-indicator)' : stroke;
  const strokeWidthValue = selected ? strokeWidth + 1 : strokeWidth;

  return (
    <>
      <g className={`react-flow__edge stage-edge ${selected ? 'selected' : ''}`}>
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

        <path
          d={pathData}
          stroke="transparent"
          strokeWidth={20}
          fill="none"
          pointerEvents="stroke"
        />
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

const StageEdgeInnerMemo = memo(StageEdgeInner);

function StageEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style,
  stroke,
  strokeWidth,
  arrowSize,
  ...rest
}: Props) {
  const geometry = useStore((state: ReactFlowState): StageEdgeGeometry => {
    const sourceNode = state.nodeLookup.get(rest.source);
    const targetNode = state.nodeLookup.get(rest.target);

    return {
      sourceX: sourceNode ? sourceNode.position.x + (sourceNode.measured?.width ?? 0) : sourceX,
      sourceY: sourceNode ? sourceNode.position.y + 32 : sourceY,
      targetX: targetNode?.position.x ?? targetX,
      targetY: targetNode ? targetNode.position.y + 32 : targetY,
    };
  }, stageEdgeGeometryEquality);

  return (
    <StageEdgeInnerMemo
      geometry={geometry}
      sourcePosition={sourcePosition}
      targetPosition={targetPosition}
      selected={selected}
      style={style}
      stroke={stroke}
      strokeWidth={strokeWidth}
      arrowSize={arrowSize}
      {...rest}
    />
  );
}

export const StageEdge = memo(StageEdgeComponent);
