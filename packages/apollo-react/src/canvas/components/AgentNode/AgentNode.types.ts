import { BaseNodeData, HandleConfiguration } from "../BaseNode/BaseNode.types";

export interface AgentNodeData extends Omit<BaseNodeData, "shape" | "handleConfigurations"> {
  shape?: "rectangle";
  handleConfigurations?: HandleConfiguration[];
}
