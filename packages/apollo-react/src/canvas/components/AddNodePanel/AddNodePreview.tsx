import React from "react";
import type { NodeProps } from "@uipath/uix/xyflow/react";
import { Handle, Position } from "@uipath/uix/xyflow/react";
import styled from "@emotion/styled";
import { ApIcon } from "@uipath/portal-shell-react";
import { DEFAULT_NODE_SIZE } from "../../constants";

const PreviewContainer = styled.div<{ selected?: boolean; width?: number; height?: number }>`
  width: ${(props) => props.width ?? DEFAULT_NODE_SIZE}px;
  height: ${(props) => props.height ?? DEFAULT_NODE_SIZE}px;
  border-radius: 16px;
  background: var(--color-background-secondary);
  border: 2px dashed ${(props) => (props.selected ? "var(--color-selection-indicator)" : "var(--color-border-de-emp)")};
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
}

const getIcon = (iconName?: string): React.ReactElement => {
  if (iconName) {
    return <ApIcon color="var(--color-foreground-de-emp)" name={iconName} size="40px" />;
  }

  return <ApIcon color="var(--color-foreground-de-emp)" name="more_horiz" size="40px" />;
};

export const AddNodePreview: React.FC<NodeProps> = ({ selected, data, width, height }) => {
  const nodeData = data as AddNodePreviewData;
  const icon = getIcon(nodeData?.iconName);

  return (
    <>
      <PreviewContainer selected={selected} width={width} height={height}>
        {icon}
      </PreviewContainer>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: "transparent",
          border: "none",
          width: 8,
          height: 8,
        }}
        isConnectable={false}
      />

      {nodeData?.showOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{
            background: "transparent",
            border: "none",
          }}
          isConnectable={false}
        />
      )}
    </>
  );
};
