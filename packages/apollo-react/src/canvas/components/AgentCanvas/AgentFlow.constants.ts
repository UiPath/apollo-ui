import { Position } from '@uipath/apollo-react/canvas/xyflow/react';

export enum ResourceNodeType {
  Context = 'context',
  Escalation = 'escalation',
  MCP = 'mcp',
  Tool = 'tool',
  MemorySpace = 'memorySpace',
  A2A = 'a2a',
}

export const ResourceNodeTypeToPosition: Record<ResourceNodeType, Position> = {
  [ResourceNodeType.Context]: Position.Bottom,
  [ResourceNodeType.Escalation]: Position.Top,
  [ResourceNodeType.MCP]: Position.Bottom,
  [ResourceNodeType.Tool]: Position.Bottom,
  [ResourceNodeType.MemorySpace]: Position.Top,
  [ResourceNodeType.A2A]: Position.Bottom,
};

// Consistent ordering for resource node types
// Top: MemorySpace -> Escalation
// Bottom: Context -> Tool -> MCP -> A2A
export const ResourceNodeTypeOrder: Record<ResourceNodeType, number> = {
  [ResourceNodeType.MemorySpace]: 0,
  [ResourceNodeType.Escalation]: 1,
  [ResourceNodeType.Context]: 2,
  [ResourceNodeType.Tool]: 3,
  [ResourceNodeType.MCP]: 4,
  [ResourceNodeType.A2A]: 5,
};
