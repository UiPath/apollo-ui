import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID } from '../constants';
import {
  type ContainerPlacement,
  DEFAULT_CONTAINER_HEIGHT,
  DEFAULT_CONTAINER_MIN_HEIGHT,
  DEFAULT_CONTAINER_MIN_WIDTH,
  DEFAULT_CONTAINER_WIDTH,
  ensureContainersFitChildren,
  getContainerFitGeometry,
  getContainerResizeMinimums,
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
      minWidth: DEFAULT_CONTAINER_WIDTH,
      minHeight: DEFAULT_CONTAINER_HEIGHT,
      padding: { left: 144, right: 144, top: 96, bottom: 48 },
    });
  });

  it('computes side-specific resize minimums that keep children inside the body', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 704, height: 368 },
      data: {},
    };
    const leftTopChild: Node = {
      id: 'left-top-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 176, y: 128 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const rightBottomChild: Node = {
      id: 'right-bottom-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 416, y: 192 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    expect(
      getContainerResizeMinimums(containerNode, [containerNode, leftTopChild, rightBottomChild])
    ).toEqual({
      left: 672,
      right: 656,
      top: 336,
      bottom: 336,
    });
  });

  it('uses default resize minimums when a container has no visible children', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 704, height: 368 },
      data: {},
    };

    expect(getContainerResizeMinimums(containerNode, [containerNode])).toEqual({
      left: DEFAULT_CONTAINER_MIN_WIDTH,
      right: DEFAULT_CONTAINER_MIN_WIDTH,
      top: DEFAULT_CONTAINER_MIN_HEIGHT,
      bottom: DEFAULT_CONTAINER_MIN_HEIGHT,
    });
  });

  it('caps resize minimums at the current size when children already cross the body', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const childNode: Node = {
      id: 'child-1',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 96, y: 64 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    expect(getContainerResizeMinimums(containerNode, [containerNode, childNode])).toMatchObject({
      left: 560,
      top: 320,
    });
  });

  it('does not return resize minimums below the defaults when the current size is already smaller', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 320, height: 160 },
      data: {},
    };
    const childNode: Node = {
      id: 'child-1',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 96, y: 64 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    expect(getContainerResizeMinimums(containerNode, [containerNode, childNode])).toMatchObject({
      left: DEFAULT_CONTAINER_MIN_WIDTH,
      top: DEFAULT_CONTAINER_MIN_HEIGHT,
    });
  });

  it('ignores preview, hidden, and ignored child types when computing resize minimums', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 704, height: 368 },
      data: {},
    };
    const previewChild: Node = {
      id: PREVIEW_NODE_ID,
      type: 'preview',
      parentId: containerNode.id,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const hiddenChild: Node = {
      id: 'hidden-child',
      type: 'task',
      parentId: containerNode.id,
      hidden: true,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const ignoredChild: Node = {
      id: 'ignored-child',
      type: 'stickyNote',
      parentId: containerNode.id,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    expect(
      getContainerResizeMinimums(
        containerNode,
        [containerNode, previewChild, hiddenChild, ignoredChild],
        { ignoredNodeTypes: ['stickyNote'] }
      )
    ).toEqual({
      left: DEFAULT_CONTAINER_MIN_WIDTH,
      right: DEFAULT_CONTAINER_MIN_WIDTH,
      top: DEFAULT_CONTAINER_MIN_HEIGHT,
      bottom: DEFAULT_CONTAINER_MIN_HEIGHT,
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
    expect(result.nodes.find((node) => node.id === childNode.id)).toBe(childNode);
  });

  it('shifts children down and grows when a child starts above the safe area', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 704, height: 320 },
      data: {},
    };
    const topChild: Node = {
      id: 'top-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 240, y: 32 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const bodyChild: Node = {
      id: 'body-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 384, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    const result = ensureContainersFitChildren([containerNode, topChild, bodyChild], {
      getContainerFitGeometry: () => getContainerFitGeometry(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        containerId: containerNode.id,
        previousSize: { width: 704, height: 320 },
        nextSize: { width: 704, height: 384 },
      }),
    ]);
    expect(result.nodes.find((node) => node.id === 'top-child')?.position).toEqual({
      x: 240,
      y: 96,
    });
    expect(result.nodes.find((node) => node.id === 'body-child')?.position).toEqual({
      x: 384,
      y: 176,
    });
  });

  it('shifts children right and grows when a child starts left of the safe area', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const leftChild: Node = {
      id: 'left-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 96, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const bodyChild: Node = {
      id: 'body-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    const result = ensureContainersFitChildren([containerNode, leftChild, bodyChild], {
      getContainerFitGeometry: () => getContainerFitGeometry(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        containerId: containerNode.id,
        previousSize: { width: 560, height: 320 },
        nextSize: { width: 608, height: 320 },
      }),
    ]);
    expect(result.nodes.find((node) => node.id === 'left-child')?.position).toEqual({
      x: 144,
      y: 112,
    });
    expect(result.nodes.find((node) => node.id === 'body-child')?.position).toEqual({
      x: 288,
      y: 112,
    });
  });

  it('ignores preview, hidden, and ignored child types when fitting', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const bodyChild: Node = {
      id: 'body-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 144, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const previewChild: Node = {
      id: PREVIEW_NODE_ID,
      type: 'preview',
      parentId: containerNode.id,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const hiddenChild: Node = {
      id: 'hidden-child',
      type: 'task',
      parentId: containerNode.id,
      hidden: true,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const ignoredChild: Node = {
      id: 'ignored-child',
      type: 'stickyNote',
      parentId: containerNode.id,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    const result = ensureContainersFitChildren(
      [containerNode, bodyChild, previewChild, hiddenChild, ignoredChild],
      {
        getContainerFitGeometry: () => getContainerFitGeometry(),
        ignoredNodeTypes: ['stickyNote'],
      }
    );

    expect(result.changes).toEqual([]);
    expect(result.nodes.find((node) => node.id === containerNode.id)).toMatchObject({
      style: { width: 560, height: 320 },
    });
    expect(result.nodes.find((node) => node.id === PREVIEW_NODE_ID)?.position).toEqual({
      x: 0,
      y: 0,
    });
    expect(result.nodes.find((node) => node.id === 'hidden-child')?.position).toEqual({
      x: 0,
      y: 0,
    });
    expect(result.nodes.find((node) => node.id === 'ignored-child')?.position).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('does not shift preview, hidden, or ignored children when applying leading padding', () => {
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const topChild: Node = {
      id: 'top-child',
      type: 'task',
      parentId: containerNode.id,
      position: { x: 144, y: 32 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const previewChild: Node = {
      id: PREVIEW_NODE_ID,
      type: 'preview',
      parentId: containerNode.id,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const hiddenChild: Node = {
      id: 'hidden-child',
      type: 'task',
      parentId: containerNode.id,
      hidden: true,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const ignoredChild: Node = {
      id: 'ignored-child',
      type: 'stickyNote',
      parentId: containerNode.id,
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    const result = ensureContainersFitChildren(
      [containerNode, topChild, previewChild, hiddenChild, ignoredChild],
      {
        getContainerFitGeometry: () => getContainerFitGeometry(),
        ignoredNodeTypes: ['stickyNote'],
      }
    );

    expect(result.nodes.find((node) => node.id === 'top-child')?.position).toEqual({
      x: 144,
      y: 96,
    });
    expect(result.nodes.find((node) => node.id === PREVIEW_NODE_ID)?.position).toEqual({
      x: 0,
      y: 0,
    });
    expect(result.nodes.find((node) => node.id === 'hidden-child')?.position).toEqual({
      x: 0,
      y: 0,
    });
    expect(result.nodes.find((node) => node.id === 'ignored-child')?.position).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('fits ancestors after a nested container grows from leading padding', () => {
    const outerContainer: Node = {
      id: 'outer',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 704, height: 320 },
      data: {},
    };
    const innerContainer: Node = {
      id: 'inner',
      type: 'loop',
      parentId: outerContainer.id,
      extent: 'parent',
      position: { x: 144, y: 32 },
      style: { width: 400, height: 224 },
      data: {},
    };
    const innerChild: Node = {
      id: 'inner-child',
      type: 'task',
      parentId: innerContainer.id,
      extent: 'parent',
      position: { x: 144, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    const result = ensureContainersFitChildren([outerContainer, innerContainer, innerChild], {
      containerIds: [innerContainer.id],
      getContainerFitGeometry: () => getContainerFitGeometry(),
    });

    expect(result.nodes.find((node) => node.id === 'inner-child')?.position).toEqual({
      x: 144,
      y: 96,
    });
    expect(result.nodes.find((node) => node.id === 'inner')?.position).toEqual({
      x: 144,
      y: 96,
    });
    expect(result.nodes.find((node) => node.id === 'inner')).toMatchObject({
      style: { width: DEFAULT_CONTAINER_WIDTH, height: DEFAULT_CONTAINER_HEIGHT },
    });
    expect(result.nodes.find((node) => node.id === 'outer')).toMatchObject({
      style: { width: 848, height: 464 },
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

  it('pushes top-level siblings below a container down when nested growth makes the container taller', () => {
    // ContainerA sits at the top with a top-level NodeB directly beneath it.
    // Adding a tall child inside ContainerA forces vertical growth — NodeB
    // must shift down so it stays clear of the container's new bottom edge.
    const containerNode: Node = {
      id: 'container-a',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: DEFAULT_CONTAINER_MIN_WIDTH, height: DEFAULT_CONTAINER_MIN_HEIGHT },
      data: {},
    };
    const siblingBelow: Node = {
      id: 'node-b',
      type: 'task',
      position: { x: 96, y: 280 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const insertedNode: Node = {
      id: 'inner-container',
      type: 'loop',
      parentId: 'container-a',
      extent: 'parent',
      position: { x: 0, y: 0 },
      style: { width: 320, height: 320 },
      data: {},
    };
    const placement: ContainerPlacement = {
      containerId: 'container-a',
      sourceNodeId: 'container-a',
      targetNodeId: 'container-a',
      mode: 'first-child',
    };

    const placed = placeContainerNode({
      nodes: [containerNode, siblingBelow, insertedNode],
      insertedNode,
      placement,
      edges: [],
      getNodeDimensions: (node) => getNodeDimensions(node),
    });

    const grownContainer = placed.find((node) => node.id === 'container-a');
    const containerHeight =
      (grownContainer?.style?.height as number | undefined) ?? DEFAULT_CONTAINER_MIN_HEIGHT;
    const containerBottom = (grownContainer?.position.y ?? 0) + containerHeight;

    const movedSibling = placed.find((node) => node.id === 'node-b');
    expect(movedSibling?.position.y).toBeGreaterThanOrEqual(containerBottom);
    // Original X is preserved — vertical growth shouldn't push horizontally.
    expect(movedSibling?.position.x).toBe(96);
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

describe('placeContainerNode cyclic edges', () => {
  it('does not shift the source when inserting on a child self-loop', () => {
    // Mirrors the top-level loopback regression but inside a container: a
    // Loop V1-like child has a self-loop edge (output → loopBack). Inserting
    // onto that edge must not shift the cyclic child away from the inserted
    // node — the chain walk reaches back to the source, so placeContainerNode
    // would otherwise push the loop right and produce a backward-wrapping
    // body edge.
    const containerNode: Node = {
      id: 'outer',
      type: 'loop',
      position: { x: 0, y: 0 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const innerLoop: Node = {
      id: 'inner-loop',
      type: 'while-like',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 144, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const insertedNode: Node = {
      id: 'inserted',
      type: 'task',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 288, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const placement: ContainerPlacement = {
      containerId: 'outer',
      sourceNodeId: 'inner-loop',
      targetNodeId: 'inner-loop',
      mode: 'sequence',
    };
    const selfLoopEdge = {
      id: 'e-inner-self',
      source: 'inner-loop',
      target: 'inner-loop',
      sourceHandle: 'output',
      targetHandle: 'loopBack',
    };

    const placed = placeContainerNode({
      nodes: [containerNode, innerLoop, insertedNode],
      insertedNode,
      placement,
      edges: [selfLoopEdge],
      getNodeDimensions: (node) => getNodeDimensions(node),
    });

    const placedInner = placed.find((node) => node.id === 'inner-loop');
    // The cyclic child must stay put — it is both source and target of the
    // edge being replaced.
    expect(placedInner?.position).toEqual({ x: 144, y: 112 });
  });

  it('does not shift the loop when its body chain branches to the parent loopBack', () => {
    // Reproduces the third-insertion regression: a Loop V1-style child inside
    // a For Each container has both a self-loop body chain (output → … →
    // loopBack) AND a parent-loopBack edge (success → container.loopBack)
    // created by createLoopBackEdgesForNewLoop. The original edge here is
    // n2 → inner-loop (a back-edge in the body chain), so the x-position
    // check (`source.x >= target.x`) skips the shift, keeping the loop
    // anchored at its original x while the inserted node lives past n2.
    const containerNode: Node = {
      id: 'outer',
      type: 'foreach',
      position: { x: 0, y: 0 },
      style: { width: 800, height: 320 },
      data: {},
    };
    const innerLoop: Node = {
      id: 'inner-loop',
      type: 'while-like',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 144, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const n2: Node = {
      id: 'n2',
      type: 'task',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 288, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const insertedNode: Node = {
      id: 'inserted',
      type: 'task',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 432, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    // body: inner-loop.output → n2
    // back: n2.output → inner-loop.loopBack    ← about to be replaced
    // parent: inner-loop.success → outer.loopBack
    const edges = [
      {
        id: 'e-loop-n2',
        source: 'inner-loop',
        target: 'n2',
        sourceHandle: 'output',
        targetHandle: 'input',
      },
      {
        id: 'e-n2-loop',
        source: 'n2',
        target: 'inner-loop',
        sourceHandle: 'output',
        targetHandle: 'loopBack',
      },
      {
        id: 'e-loop-parent',
        source: 'inner-loop',
        target: 'outer',
        sourceHandle: 'success',
        targetHandle: 'loopBack',
      },
    ];
    const placement: ContainerPlacement = {
      containerId: 'outer',
      sourceNodeId: 'n2',
      targetNodeId: 'inner-loop',
      mode: 'sequence',
    };

    const placed = placeContainerNode({
      nodes: [containerNode, innerLoop, n2, insertedNode],
      insertedNode,
      placement,
      edges,
      getNodeDimensions: (node) => getNodeDimensions(node),
    });

    const placedInner = placed.find((node) => node.id === 'inner-loop');
    // The loop is the body chain's source — it must not shift right past the
    // inserted node, even though the linear chain walk from itself terminates
    // early due to the parent-loopBack branch.
    expect(placedInner?.position).toEqual({ x: 144, y: 112 });
  });

  it('still shifts the chain on a plain forward insert when target wires back to container.continue', () => {
    // Regression: a child wiring back to `container.continue` is a normal
    // forward chain in a For Each, not a back-edge. The shift must apply
    // when the original edge is a sibling→sibling forward edge — even
    // though the chain walk from the target reaches `outer` via the
    // continue back-edge. The x-position check (`source.x < target.x`)
    // correctly classifies n1 → n2 as forward and shifts n2 right.
    const containerNode: Node = {
      id: 'outer',
      type: 'foreach',
      position: { x: 0, y: 0 },
      style: { width: 1024, height: 320 },
      data: {},
    };
    const n1: Node = {
      id: 'n1',
      type: 'task',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 144, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const n2: Node = {
      id: 'n2',
      type: 'task',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 288, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    // Wider rectangle inserted between n1 and n2 — n2 must shift right.
    const insertedNode: Node = {
      id: 'inserted',
      type: 'agent',
      parentId: 'outer',
      extent: 'parent',
      position: { x: 0, y: 112 },
      measured: { width: 288, height: 96 },
      data: {},
    };
    // Forward chain inside the container, with the conventional loopback to
    // the container's continue handle from the last child.
    const edges = [
      {
        id: 'e-start-n1',
        source: 'outer',
        target: 'n1',
        sourceHandle: 'start',
        targetHandle: 'input',
      },
      { id: 'e-n1-n2', source: 'n1', target: 'n2', sourceHandle: 'output', targetHandle: 'input' },
      {
        id: 'e-n2-continue',
        source: 'n2',
        target: 'outer',
        sourceHandle: 'output',
        targetHandle: 'continue',
      },
    ];
    const placement: ContainerPlacement = {
      containerId: 'outer',
      sourceNodeId: 'n1',
      targetNodeId: 'n2',
      mode: 'sequence',
    };

    const placed = placeContainerNode({
      nodes: [containerNode, n1, n2, insertedNode],
      insertedNode,
      placement,
      edges,
      getNodeDimensions: (node) => getNodeDimensions(node),
    });

    const placedN1 = placed.find((node) => node.id === 'n1');
    const placedN2 = placed.find((node) => node.id === 'n2');
    // n1 stays put; n2 moves right to clear the inserted rectangle.
    expect(placedN1?.position).toEqual({ x: 144, y: 112 });
    expect(placedN2?.position.x).toBeGreaterThan(288);
  });
});
