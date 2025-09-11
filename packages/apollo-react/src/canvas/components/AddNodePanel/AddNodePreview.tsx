import React from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import styled from "@emotion/styled";
import { ApIcon } from "@uipath/portal-shell-react";

const PreviewContainer = styled.div<{ selected?: boolean }>`
  width: 96px;
  height: 96px;
  border-radius: calc(0.5 * 100% / (1.75));
  background: var(--color-background-secondary);
  border: 2px dashed ${(props) => (props.selected ? "var(--color-selection-indicator)" : "var(--color-border-de-emp)")};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  opacity: ${(props) => (props.selected ? 0.8 : 0.6)};
`;

interface AddNodePreviewProps extends NodeProps {
  icon?: React.ReactElement;
}

export const AddNodePreview: React.FC<AddNodePreviewProps> = ({ selected, icon }) => {
  return (
    <>
      <PreviewContainer selected={selected}>
        {icon || <ApIcon color="var(--color-foreground-de-emp)" name="add" size="32px" />}
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
