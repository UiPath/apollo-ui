import { Position } from '@uipath/apollo-react/canvas/xyflow/react';

export enum ResourceNodeType {
  Context = 'context',
  Escalation = 'escalation',
  MCP = 'mcp',
  Tool = 'tool',
  MemorySpace = 'memorySpace',
  A2A = 'a2a',
  Skills = 'skills',
}

export const ResourceNodeTypeToPosition: Record<ResourceNodeType, Position> = {
  [ResourceNodeType.Context]: Position.Bottom,
  [ResourceNodeType.Escalation]: Position.Top,
  [ResourceNodeType.MCP]: Position.Bottom,
  [ResourceNodeType.Tool]: Position.Bottom,
  [ResourceNodeType.MemorySpace]: Position.Top,
  [ResourceNodeType.A2A]: Position.Bottom,
  [ResourceNodeType.Skills]: Position.Top,
};

// Consistent ordering for resource node types
// Top: MemorySpace -> Escalation -> Skills
// Bottom: Context -> Tool -> MCP -> A2A
export const ResourceNodeTypeOrder: Record<ResourceNodeType, number> = {
  [ResourceNodeType.MemorySpace]: 0,
  [ResourceNodeType.Escalation]: 1,
  [ResourceNodeType.Skills]: 2,
  [ResourceNodeType.Context]: 3,
  [ResourceNodeType.Tool]: 4,
  [ResourceNodeType.MCP]: 5,
  [ResourceNodeType.A2A]: 6,
};
