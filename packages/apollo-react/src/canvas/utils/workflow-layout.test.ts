import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  CONTAINER_CHAIN_NODE_IDS,
  makeContainerChainFixture,
  makeCycleFixture,
  makeDiamondFixture,
} from './sequential/fixtures';
import { layoutWorkflowLeftToRight } from './workflow-layout';

const size = { width: 100, height: 60 };
const fixedSize = () => size;

describe('layoutWorkflowLeftToRight', () => {
  it('places a linear workflow in dependency order from left to right', () => {
    const nodes = [node('a'), node('b'), node('c')];
    const edges = [edge('a', 'b'), edge('b', 'c')];

    const result = layoutWorkflowLeftToRight(nodes, edges, {
      rankGap: 40,
      getNodeDimensions: fixedSize,
    });

    expect(result.positions.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.positions.get('b')).toEqual({ x: 140, y: 0 });
    expect(result.positions.get('c')).toEqual({ x: 280, y: 0 });
    expect(result.bounds).toEqual({ x: 0, y: 0, width: 380, height: 60 });
    expect(nodes.map((item) => item.position)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it('stacks branch lanes and puts their merge in a later rank', () => {
    const { nodes, edges } = makeDiamondFixture();
    const result = layoutWorkflowLeftToRight(nodes, edges, {
      rankGap: 40,
      nodeGap: 20,
      getNodeDimensions: fixedSize,
    });

    const branch = result.positions.get('if')!;
    const thenNode = result.positions.get('b')!;
    const elseNode = result.positions.get('c')!;
    const merge = result.positions.get('d')!;

    expect(thenNode.x).toBeGreaterThan(branch.x);
    expect(elseNode.x).toBe(thenNode.x);
    expect(elseNode.y).toBeGreaterThanOrEqual(thenNode.y + size.height + 20);
    expect(merge.x).toBeGreaterThan(thenNode.x);
  });

  it('collapses cycles into one finite, deterministic rank', () => {
    const fixture = makeCycleFixture();
    const first = layoutWorkflowLeftToRight(fixture.nodes, fixture.edges, {
      nodeGap: 20,
      getNodeDimensions: fixedSize,
    });
    const second = layoutWorkflowLeftToRight(fixture.nodes, fixture.edges, {
      nodeGap: 20,
      getNodeDimensions: fixedSize,
    });

    expect([...first.positions]).toEqual([...second.positions]);
    expect(new Set([...first.positions.values()].map((position) => position.x))).toEqual(
      new Set([0])
    );
    expect([...first.positions.values()].map((position) => position.y)).toEqual([0, 80, 160]);
  });

  it('lays out children in the parent coordinate frame and grows the container', () => {
    const fixture = makeContainerChainFixture();
    const ids = CONTAINER_CHAIN_NODE_IDS;
    const result = layoutWorkflowLeftToRight(fixture.nodes, fixture.edges, {
      rankGap: 40,
      getNodeDimensions: fixedSize,
      isContainerNode: (item) => item.id === ids.container,
    });

    const containerSize = result.dimensions.get(ids.container)!;
    const firstChild = result.positions.get(ids.x)!;
    const secondChild = result.positions.get(ids.y)!;
    const container = result.positions.get(ids.container)!;
    const successor = result.positions.get(ids.b)!;

    expect(firstChild.x).toBeGreaterThan(0);
    expect(firstChild.y).toBeGreaterThan(0);
    expect(secondChild.x).toBeGreaterThan(firstChild.x);
    expect(containerSize.width).toBeGreaterThanOrEqual(secondChild.x + size.width);
    expect(containerSize.height).toBeGreaterThanOrEqual(firstChild.y + size.height);
    expect(successor.x).toBeGreaterThanOrEqual(container.x + containerSize.width + 40);
    expect(result.resizedNodeIds).toEqual(new Set([ids.container]));
  });

  it('preserves presentation-only nodes by omitting them from the layout result', () => {
    const nodes = [node('a'), node('note', 'sticky', { x: 900, y: 700 }), node('b')];
    const edges = [edge('a', 'b')];
    const result = layoutWorkflowLeftToRight(nodes, edges, {
      getNodeDimensions: fixedSize,
      isLayoutNode: (item) => item.type !== 'sticky',
    });

    expect(result.positions.has('note')).toBe(false);
    expect(nodes[1]!.position).toEqual({ x: 900, y: 700 });
    expect(result.positions.get('b')!.x).toBeGreaterThan(result.positions.get('a')!.x);
  });

  it('accounts for non-default node origins when returning XYFlow positions', () => {
    const centered = node('centered');
    centered.origin = [0.5, 0.5];

    const result = layoutWorkflowLeftToRight([centered], [], {
      origin: { x: 20, y: 30 },
      getNodeDimensions: fixedSize,
    });

    expect(result.positions.get('centered')).toEqual({ x: 70, y: 60 });
    expect(result.bounds).toEqual({ x: 20, y: 30, width: 100, height: 60 });
  });
});

function node(id: string, type = 'task', position = { x: 0, y: 0 }): Node {
  return { id, type, position, data: {} };
}

function edge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}
