import { describe, expect, it } from 'vitest';
import { categoryManifestSchema, edgeSchema, nodeManifestSchema, nodeSchema } from '../index';

describe('flow-node-schema', () => {
  it('validates a minimal node manifest', () => {
    const result = nodeManifestSchema.safeParse({
      nodeType: 'uipath.test',
      version: '1.0.0',
      tags: ['test'],
      sortOrder: 0,
      display: {
        label: 'Test Node',
        icon: 'test-icon',
      },
      handleConfiguration: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a node manifest missing required fields', () => {
    const result = nodeManifestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('validates a node instance', () => {
    const result = nodeSchema.safeParse({
      id: 'node-1',
      type: 'uipath.test',
      typeVersion: '1.0.0',
      ui: { position: { x: 0, y: 0 } },
      display: {},
    });
    expect(result.success).toBe(true);
  });

  it('validates an edge instance', () => {
    const result = edgeSchema.safeParse({
      id: 'edge-1',
      sourceNodeId: 'node-1',
      sourcePort: 'output',
      targetNodeId: 'node-2',
      targetPort: 'input',
    });
    expect(result.success).toBe(true);
  });

  it('validates a category manifest', () => {
    const result = categoryManifestSchema.safeParse({
      id: 'control-flow',
      name: 'Control Flow',
      sortOrder: 0,
      color: '#000',
      colorDark: '#fff',
      icon: 'flow',
      tags: [],
    });
    expect(result.success).toBe(true);
  });
});
