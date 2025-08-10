import React from "react";
import { Handle, Position } from "@xyflow/react";
import styled from "@emotion/styled";

const StyledHandle = styled(Handle)<{ isVisible: boolean; position: Position }>`
  position: absolute;
  top: 0;
  left: ${(props) => (props.position === Position.Left ? "-15px" : "auto")};
  right: ${(props) => (props.position === Position.Right ? "-15px" : "auto")};
  width: 20px;
  height: 100%;
  background: transparent;
  border: 0px solid transparent;
  border-radius: 0;
  transform: unset;
  opacity: ${(props) => (props.isVisible ? 0.5 : 0)};
`;

interface StageHandleProps {
  id: string;
  type: "source" | "target";
  position: Position;
  isVisible?: boolean;
}

export const StageHandle: React.FC<StageHandleProps> = ({ id, type, position, isVisible = true }) => {
  return <StyledHandle id={id} type={type} position={position} isVisible={isVisible} isConnectable={true} />;
};
