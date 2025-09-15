import { Position } from "@xyflow/react";

export enum ResourceNodeType {
  Context = "context",
  Escalation = "escalation",
  MCP = "mcp",
  Model = "model",
  Tool = "tool",
  Memory = "memory",
}

export const ResourceNodeTypeToPosition: Record<ResourceNodeType, Position> = {
  [ResourceNodeType.Context]: Position.Top,
  [ResourceNodeType.Escalation]: Position.Bottom,
  [ResourceNodeType.MCP]: Position.Bottom,
  [ResourceNodeType.Model]: Position.Bottom,
  [ResourceNodeType.Tool]: Position.Bottom,
  [ResourceNodeType.Memory]: Position.Top,
};
