import React from "react";
import type { NodeProps } from "@uipath/uix/xyflow/react";
import { Handle, Position } from "@uipath/uix/xyflow/react";
import styled from "@emotion/styled";
import { ApIcon } from "@uipath/portal-shell-react";

const PreviewContainer = styled.div<{ selected?: boolean }>`
  width: 96px;
  height: 96px;
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
}

const getIcon = (iconName?: string): React.ReactElement => {
  if (iconName) {
    return <ApIcon color="var(--color-foreground-de-emp)" name={iconName} size="40px" />;
  }

  return <ApIcon color="var(--color-foreground-de-emp)" name="more_horiz" size="40px" />;
};

export const AddNodePreview: React.FC<NodeProps> = ({ selected, data }) => {
  const nodeData = data as AddNodePreviewData;
  const icon = getIcon(nodeData?.iconName);

  return (
    <>
      <PreviewContainer selected={selected}>{icon}</PreviewContainer>

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
      />
    </>
  );
};
