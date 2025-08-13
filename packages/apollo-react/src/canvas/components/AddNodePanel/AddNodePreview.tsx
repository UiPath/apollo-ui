import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import styled from "@emotion/styled";
import { ApIcon } from "@uipath/portal-shell-react";

const PreviewContainer = styled.div<{ selected?: boolean }>`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background: var(--color-background-secondary);
  border: 2px dashed ${(props) => (props.selected ? "var(--color-selection-indicator)" : "var(--color-border-de-emp)")};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  opacity: ${(props) => (props.selected ? 0.8 : 0.6)};
`;

export const AddNodePreview: React.FC<NodeProps> = ({ selected }) => {
  return (
    <>
      <PreviewContainer selected={selected}>
        <ApIcon color="var(--color-foreground-de-emp)" name="add" size="32px" />
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
      />
    </>
  );
};
