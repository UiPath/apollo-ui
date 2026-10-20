import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TRIGGER_NODE_TYPE } from '../../constants';
import type { NodeManifest } from '../../schema/node-definition';
import { createSequencePredicates, defaultIsSequenceNode, defaultIsStartNode } from './predicates';

const node = (id: string, type: string): Node => ({ id, type, position: { x: 0, y: 0 }, data: {} });

const manifest = (overrides: Partial<NodeManifest>): NodeManifest =>
  ({
    nodeType: 'x',
    display: { label: 'X' },
    handleConfiguration: [],
    ...overrides,
  }) as NodeManifest;

const MANIFESTS: Record<string, NodeManifest> = {
  tool: manifest({
    handleConfiguration: [
      { position: 'left', handles: [{ id: 'in', type: 'target', handleType: 'artifact' }] },
    ],
  }),
  step: manifest({
    handleConfiguration: [
      { position: 'left', handles: [{ id: 'input', type: 'target', handleType: 'input' }] },
      { position: 'right', handles: [{ id: 'tools', type: 'source', handleType: 'artifact' }] },
    ],
  }),
  trigger: manifest({ category: 'trigger' }),
  loop: manifest({ display: { label: 'Loop', shape: 'container' } }),
};

describe('createSequencePredicates', () => {
  const predicates = createSequencePredicates((type) => MANIFESTS[type]);

  it('excludes sticky notes and artifact-only resources from the sequence', () => {
    expect(predicates.isSequenceNode(node('a', 'stickyNote'))).toBe(false);
    expect(predicates.isSequenceNode(node('b', 'tool'))).toBe(false);
    expect(predicates.isSequenceNode(node('c', 'step'))).toBe(true);
    expect(predicates.isSequenceNode(node('d', 'unknown'))).toBe(true);
  });

  it('treats the first-run type and trigger-category manifests as start nodes', () => {
    expect(predicates.isStartNode(node('a', DEFAULT_TRIGGER_NODE_TYPE))).toBe(true);
    expect(predicates.isStartNode(node('b', 'trigger'))).toBe(true);
    expect(predicates.isStartNode(node('c', 'step'))).toBe(false);
  });

  it('treats container-shaped manifests as containers', () => {
    expect(predicates.isContainerNode(node('a', 'loop'))).toBe(true);
    expect(predicates.isContainerNode(node('b', 'step'))).toBe(false);
  });

  it('falls back to the registry-free defaults without a lookup', () => {
    const bare = createSequencePredicates();
    expect(bare.isSequenceNode(node('a', 'tool'))).toBe(true);
    expect(bare.isSequenceNode(node('b', 'stickyNote'))).toBe(false);
    expect(bare.isStartNode(node('c', 'trigger'))).toBe(false);
    expect(bare.isStartNode(node('d', DEFAULT_TRIGGER_NODE_TYPE))).toBe(true);
    expect(bare.isContainerNode(node('e', 'loop'))).toBe(false);
  });

  it('exposes the defaults the compatibility report and projection use', () => {
    expect(defaultIsSequenceNode(node('a', 'stickyNote'))).toBe(false);
    expect(defaultIsStartNode(node('b', DEFAULT_TRIGGER_NODE_TYPE))).toBe(true);
  });
});
