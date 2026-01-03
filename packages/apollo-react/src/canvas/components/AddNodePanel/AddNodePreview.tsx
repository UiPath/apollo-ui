import styled from '@emotion/styled';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import type React from 'react';
import { DEFAULT_NODE_SIZE } from '../../constants';

const PreviewContainer = styled.div<{ selected?: boolean; width?: number; height?: number }>`
  width: ${(props) => props.width ?? DEFAULT_NODE_SIZE}px;
  height: ${(props) => props.height ?? DEFAULT_NODE_SIZE}px;
  border-radius: 16px;
  background: var(--uix-canvas-background-secondary);
  border: 2px dashed
    ${(props) =>
      props.selected ? 'var(--uix-canvas-selection-indicator)' : 'var(--uix-canvas-border-de-emp)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  opacity: ${(props) => (props.selected ? 0.8 : 0.6)};
`;

export interface AddNodePreviewData {
  iconName?: string;
  showOutputHandle?: boolean;
  inputHandlePosition?: Position;
  outputHandlePosition?: Position;
}

const getIcon = (iconName?: string): React.ReactElement => {
  if (iconName) {
    return <ApIcon color="var(--uix-canvas-foreground-de-emp)" name={iconName} size="40px" />;
  }

  return <ApIcon color="var(--uix-canvas-foreground-de-emp)" name="more_horiz" size="40px" />;
};

export const AddNodePreview: React.FC<NodeProps> = ({ selected, data, width, height }) => {
  const nodeData = data as AddNodePreviewData;
  const icon = getIcon(nodeData?.iconName);

  const inputPosition = nodeData?.inputHandlePosition ?? Position.Left;
  const outputPosition = nodeData?.outputHandlePosition ?? Position.Right;

  return (
    <>
      <PreviewContainer selected={selected} width={width} height={height}>
        {icon}
      </PreviewContainer>

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

      {nodeData?.showOutputHandle && (
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
      )}
    </>
  );
};
