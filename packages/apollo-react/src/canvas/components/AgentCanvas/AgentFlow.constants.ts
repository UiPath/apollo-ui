import { Position } from "@uipath/uix/xyflow/react";

export enum ResourceNodeType {
  Context = "context",
  Escalation = "escalation",
  MCP = "mcp",
  Model = "model",
  Tool = "tool",
  Memory = "memory",
}

export const ResourceNodeTypeToPosition: Record<ResourceNodeType, Position> = {
  [ResourceNodeType.Context]: Position.Bottom,
  [ResourceNodeType.Escalation]: Position.Top,
  [ResourceNodeType.MCP]: Position.Bottom,
  [ResourceNodeType.Model]: Position.Bottom,
  [ResourceNodeType.Tool]: Position.Bottom,
  [ResourceNodeType.Memory]: Position.Top,
};

// Consistent ordering for resource node types: Model -> Context -> Tool -> Others
export const ResourceNodeTypeOrder: Record<ResourceNodeType, number> = {
  [ResourceNodeType.Model]: 0,
  [ResourceNodeType.Context]: 1,
  [ResourceNodeType.Tool]: 2,
  [ResourceNodeType.MCP]: 3,
  [ResourceNodeType.Memory]: 4,
  [ResourceNodeType.Escalation]: 5,
};
