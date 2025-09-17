import React from "react";
import { Handle, Position, useConnection } from "@xyflow/react";
import styled from "@emotion/styled";

const StyledHandle = styled(Handle, {
  // Do not forward transient props to the DOM
  shouldForwardProp: (prop: string) => !prop.startsWith("$"),
})<{
  type: "source" | "target";
  $sourceType?: string;
  $isConnecting: boolean;
  $isVisible: boolean;
  position: Position;
}>`
  position: absolute;
  top: ${(props) => {
    if (props.position === Position.Top) return "-15px";
    if (props.position === Position.Bottom) return "auto";
    return "0";
  }};
  bottom: ${(props) => (props.position === Position.Bottom ? "-15px" : "auto")};
  left: ${(props) => {
    if (props.position === Position.Left) return "-15px";
    if (props.position === Position.Right) return "auto";
    return "0";
  }};
  right: ${(props) => (props.position === Position.Right ? "-15px" : "auto")};
  width: ${(props) => {
    if (props.position === Position.Top || props.position === Position.Bottom) {
      return props.$isConnecting && props.type !== props.$sourceType ? "calc(100% + 20px)" : "100%";
    }
    return props.$isConnecting && props.type !== props.$sourceType ? "calc(20px + 100%)" : "20px";
  }};
  height: ${(props) => {
    if (props.position === Position.Left || props.position === Position.Right) {
      return "100%";
    }
    return "20px";
  }};
  background: transparent;
  border: 0px solid transparent;
  border-radius: 0;
  transform: unset;
  opacity: ${(props) => (props.$isVisible && props.type !== props.$sourceType ? 0.5 : 0)};
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
      isConnectableStart={type === "source"}
      isConnectableEnd={type === "target"}
      id={generateHandleId(id, type, position)}
      type={type}
      $sourceType={sourceType}
      $isConnecting={inProgress}
      position={position}
      $isVisible={isVisible}
      isConnectable={true}
    />
  );
};
