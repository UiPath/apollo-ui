import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';

import {
  DEFAULT_NODE_SIZE,
  NODE_CONTAINER_RADIUS_RATIO,
  NODE_INNER_ICON_RATIO,
  NODE_INNER_RADIUS_RATIO,
  NODE_INNER_SHAPE_RATIO,
} from '../../constants';
import { getIcon } from '../../utils/icon-registry';
import { BaseInnerShape } from '../BaseNode/BaseNodeInnerShape';

export interface AddNodePreviewData {
  iconName?: string;
  inputHandlePosition?: Position;
  outputHandlePosition?: Position;
}

export const AddNodePreview: React.FC<NodeProps> = ({
  selected,
  data,
  width,
  height,
  dragging,
}) => {
  const nodeData = data as AddNodePreviewData;
  const [isHovered, setIsHovered] = useState(false);
  const handlePointerEnter = useCallback(() => setIsHovered(true), []);
  const handlePointerLeave = useCallback(() => setIsHovered(false), []);

  const icon = useMemo(() => {
    const IconComponent = getIcon(nodeData?.iconName ?? 'square-dashed');
    return <IconComponent />;
  }, [nodeData?.iconName]);

  const inputPosition = nodeData?.inputHandlePosition ?? Position.Left;
  const outputPosition = nodeData?.outputHandlePosition ?? Position.Right;

  const containerWidth = width ?? DEFAULT_NODE_SIZE;
  const containerHeight = height ?? DEFAULT_NODE_SIZE;

  const containerClassName = useMemo(
    () =>
      cn(
        'relative flex flex-col items-center justify-center bg-surface-overlay',
        'w-(--node-w) h-(--node-h) rounded-(--node-radius)',
        'border border-dashed',
        'shadow-(--canvas-node-shadow-rest) transition-[box-shadow,border-color] duration-150',
        isHovered && 'shadow-(--canvas-node-shadow-hover)',
        dragging && 'shadow-(--canvas-node-shadow-lifted) cursor-grabbing'
      ),
    [isHovered, dragging]
  );

  const containerStyle = useMemo((): React.CSSProperties => {
    const basis = Math.min(containerWidth, containerHeight);
    const gap = basis * (1 - NODE_INNER_SHAPE_RATIO);
    const innerW = containerWidth - gap;
    const innerH = containerHeight - gap;

    return {
      '--node-w': `${containerWidth}px`,
      '--node-h': `${containerHeight}px`,
      '--node-radius': `${basis * NODE_CONTAINER_RADIUS_RATIO}px`,
      '--inner-w': `${innerW}px`,
      '--inner-h': `${innerH}px`,
      '--inner-radius': `${basis * NODE_INNER_RADIUS_RATIO}px`,
      '--icon-size': `${basis * NODE_INNER_ICON_RATIO}px`,
      borderColor: selected ? 'var(--canvas-selection-indicator)' : 'var(--canvas-border-de-emp)',
      opacity: selected ? 0.8 : 0.6,
      strokeWidth: 1.5,
    } as React.CSSProperties;
  }, [containerWidth, containerHeight, selected]);

  return (
    <>
      <div
        className={containerClassName}
        style={containerStyle}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <BaseInnerShape>{icon}</BaseInnerShape>
      </div>

      <Handle
        type="target"
        position={inputPosition}
        id="input"
        style={{
          background: 'transparent',
          border: 'none',
          width: 8,
          height: 8,
        }}
        isConnectable={false}
      />

      <Handle
        type="source"
        position={outputPosition}
        id="output"
        style={{
          background: 'transparent',
          border: 'none',
        }}
        isConnectable={false}
      />
    </>
  );
};
