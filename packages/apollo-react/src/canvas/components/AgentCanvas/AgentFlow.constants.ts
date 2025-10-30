import { Position } from "@uipath/uix/xyflow/react";

export enum ResourceNodeType {
  Context = "context",
  Escalation = "escalation",
  MCP = "mcp",
  Tool = "tool",
  MemorySpace = "memorySpace",
}

export const ResourceNodeTypeToPosition: Record<ResourceNodeType, Position> = {
  [ResourceNodeType.Context]: Position.Bottom,
  [ResourceNodeType.Escalation]: Position.Bottom,
  [ResourceNodeType.MCP]: Position.Bottom,
  [ResourceNodeType.Tool]: Position.Bottom,
  [ResourceNodeType.MemorySpace]: Position.Top,
};

// Consistent ordering for resource node types: Context -> Escalation -> Tool -> Others
export const ResourceNodeTypeOrder: Record<ResourceNodeType, number> = {
  [ResourceNodeType.Context]: 0,
  [ResourceNodeType.Escalation]: 1,
  [ResourceNodeType.Tool]: 2,
  [ResourceNodeType.MCP]: 3,
  [ResourceNodeType.MemorySpace]: 4,
};
