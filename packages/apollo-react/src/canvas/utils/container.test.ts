import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  type ContainerPlacement,
  DEFAULT_CONTAINER_MIN_HEIGHT,
  DEFAULT_CONTAINER_MIN_WIDTH,
  ensureContainersFitChildren,
  getContainerFitGeometry,
  getContainerSafeArea,
  getNodeDimensions,
  placeContainerNode,
} from './container';

describe('container sizing', () => {
  it('uses the shared default container geometry', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 704, height: 368 },
      data: {},
    };

    expect(getContainerSafeArea(containerNode)).toMatchObject({
      x: 144,
      y: 96,
      width: 416,
      height: 224,
    });
    expect(getContainerFitGeometry()).toMatchObject({
      minWidth: DEFAULT_CONTAINER_MIN_WIDTH,
      minHeight: DEFAULT_CONTAINER_MIN_HEIGHT,
      padding: { right: 144, bottom: 48 },
    });
  });

  it('grows containers to fit direct children without shrinking them', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: DEFAULT_CONTAINER_MIN_WIDTH, height: DEFAULT_CONTAINER_MIN_HEIGHT },
      data: {},
    };
    const childNode: Node = {
      id: 'child-1',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 480, y: 240 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    const result = ensureContainersFitChildren([containerNode, childNode], {
      getContainerFitGeometry: () => getContainerFitGeometry(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        containerId: containerNode.id,
        previousSize: { width: DEFAULT_CONTAINER_MIN_WIDTH, height: DEFAULT_CONTAINER_MIN_HEIGHT },
        nextSize: { width: 720, height: 384 },
      }),
    ]);
    expect(result.nodes.find((node) => node.id === containerNode.id)).toMatchObject({
      style: { width: 720, height: 384 },
    });
  });
});

describe('placeContainerNode first-child placement', () => {
  it('positions the first child on the container vertical mid-line, not the body center', () => {
    // 320-tall container has enough vertical room that body-center (after
    // header padding) and container-center diverge by ~32px. The first child
    // should land aligned with the inner source handle's rail (50% of
    // container height) so the dashed Start → child edge stays a straight
    // horizontal line.
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const insertedNode: Node = {
      id: 'inserted',
      type: 'task',
      parentId: 'loop-1',
      extent: 'parent',
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const placement: ContainerPlacement = {
      containerId: 'loop-1',
      sourceNodeId: 'loop-1',
      targetNodeId: 'loop-1',
      mode: 'first-child',
    };

    const placed = placeContainerNode({
      nodes: [containerNode, insertedNode],
      insertedNode,
      placement,
      edges: [],
      getNodeDimensions: (node) => getNodeDimensions(node),
    });

    const result = placed.find((node) => node.id === 'inserted');
    // Container is 320 tall, child is 96 tall — center on the container rail
    // → 320/2 - 96/2 = 112.
    expect(result?.position.y).toBe(112);
  });

  it('clamps to safeArea.y when the container is too short for container-center placement', () => {
    // 220-tall container: container-center child y = 110 - 48 = 62, but the
    // body's safeArea starts at y=96 (header + padding). Clamp keeps the
    // child inside the body.
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 320, height: 220 },
      data: {},
    };
    const insertedNode: Node = {
      id: 'inserted',
      type: 'task',
      parentId: 'loop-1',
      extent: 'parent',
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const placement: ContainerPlacement = {
      containerId: 'loop-1',
      sourceNodeId: 'loop-1',
      targetNodeId: 'loop-1',
      mode: 'first-child',
    };

    const placed = placeContainerNode({
      nodes: [containerNode, insertedNode],
      insertedNode,
      placement,
      edges: [],
      getNodeDimensions: (node) => getNodeDimensions(node),
    });

    const result = placed.find((node) => node.id === 'inserted');
    expect(result?.position.y).toBe(96);
  });
});
