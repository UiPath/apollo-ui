import { Position } from "@uipath/uix/xyflow/react";

export enum ResourceNodeType {
  Context = "context",
  Escalation = "escalation",
  MCP = "mcp",
  Tool = "tool",
  Memory = "memory",
}

export const ResourceNodeTypeToPosition: Record<ResourceNodeType, Position> = {
  [ResourceNodeType.Context]: Position.Bottom,
  [ResourceNodeType.Escalation]: Position.Top,
  [ResourceNodeType.MCP]: Position.Bottom,
  [ResourceNodeType.Tool]: Position.Bottom,
  [ResourceNodeType.Memory]: Position.Top,
};

// Consistent ordering for resource node types: Context -> Tool -> Others
export const ResourceNodeTypeOrder: Record<ResourceNodeType, number> = {
  [ResourceNodeType.Context]: 0,
  [ResourceNodeType.Tool]: 1,
  [ResourceNodeType.MCP]: 2,
  [ResourceNodeType.Memory]: 3,
  [ResourceNodeType.Escalation]: 4,
};
