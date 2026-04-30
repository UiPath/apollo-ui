import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONTAINER_MIN_HEIGHT,
  DEFAULT_CONTAINER_MIN_WIDTH,
  ensureContainersFitChildren,
  getContainerFitGeometry,
  getContainerSafeArea,
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
