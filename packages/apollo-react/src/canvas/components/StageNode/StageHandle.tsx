import React from "react";
import { Handle, Position, useConnection } from "@xyflow/react";
import styled from "@emotion/styled";

const StyledHandle = styled(Handle)<{
  type: "source" | "target";
  sourceType?: string;
  isConnecting: boolean;
  isVisible: boolean;
  position: Position;
}>`
  position: absolute;
  top: 0;
  left: ${(props) => (props.position === Position.Left ? "-15px" : "auto")};
  right: ${(props) => (props.position === Position.Right ? "-15px" : "auto")};
  width: ${(props) => (props.isConnecting && props.type !== props.sourceType ? "calc(100% + 20px)" : "20px")};
  height: 100%;
  background: transparent;
  border: 0px solid transparent;
  border-radius: 0;
  transform: unset;
  opacity: ${(props) => (props.isVisible && props.type !== props.sourceType ? 0.5 : 0)};
`;

interface StageHandleProps {
  id: string;
  type: "source" | "target";
  position: Position;
  isVisible?: boolean;
}

const HANDLE_ID_SEPARATOR = "____";

function generateHandleId(nodeId: string, sourceOrTarget: "source" | "target", handlePosition: Position) {
  return [nodeId, sourceOrTarget, handlePosition].join(HANDLE_ID_SEPARATOR);
}

export const StageHandle: React.FC<StageHandleProps> = ({ id, type, position, isVisible = true }) => {
  const { inProgress, fromHandle } = useConnection();
  const sourceType = fromHandle?.type;
  return (
    <StyledHandle
      id={generateHandleId(id, type, position)}
      type={type}
      sourceType={sourceType}
      isConnecting={inProgress}
      position={position}
      isVisible={isVisible}
      isConnectable={true}
    />
  );
};
