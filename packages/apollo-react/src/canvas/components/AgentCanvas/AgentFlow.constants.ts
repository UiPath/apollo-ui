import { Position } from '@uipath/uix/xyflow/react';

export enum ResourceNodeType {
  Context = 'context',
  Escalation = 'escalation',
  MCP = 'mcp',
  Tool = 'tool',
  MemorySpace = 'memorySpace',
}

export const ResourceNodeTypeToPosition: Record<ResourceNodeType, Position> = {
  [ResourceNodeType.Context]: Position.Bottom,
  [ResourceNodeType.Escalation]: Position.Top,
  [ResourceNodeType.MCP]: Position.Bottom,
  [ResourceNodeType.Tool]: Position.Bottom,
  [ResourceNodeType.MemorySpace]: Position.Top,
};

// Consistent ordering for resource node types
// Top: MemorySpace -> Escalation
// Bottom: Context -> Tool -> MCP
export const ResourceNodeTypeOrder: Record<ResourceNodeType, number> = {
  [ResourceNodeType.MemorySpace]: 0,
  [ResourceNodeType.Escalation]: 1,
  [ResourceNodeType.Context]: 2,
  [ResourceNodeType.Tool]: 3,
  [ResourceNodeType.MCP]: 4,
};
