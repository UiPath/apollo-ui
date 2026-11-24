import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import type { NodeManifest } from '../schema';
import { DEFAULT_CONTAINER_HEIGHT, DEFAULT_CONTAINER_WIDTH } from './container';
import {
  COLLAPSED_NODE_SIZE,
  EXPANDED_RECTANGLE_WIDTH,
  getExpandedSize,
  getNodeFallbackSize,
  getSideHandleFloor,
} from './node-size';

describe('getExpandedSize', () => {
  it('defaults to 96 tall', () => {
    expect(getExpandedSize('square')).toEqual({ width: COLLAPSED_NODE_SIZE, height: 96 });
    expect(getExpandedSize('rectangle')).toEqual({ width: EXPANDED_RECTANGLE_WIDTH, height: 96 });
  });

  it('ignores display height on shapes that are not wide', () => {
    expect(getExpandedSize('square', 64)).toEqual({ width: COLLAPSED_NODE_SIZE, height: 96 });
    expect(getExpandedSize('circle', 128)).toEqual({ width: COLLAPSED_NODE_SIZE, height: 96 });
  });

  it("uses the node's display height when it sets one", () => {
    expect(getExpandedSize('rectangle', 64)).toEqual({
      width: EXPANDED_RECTANGLE_WIDTH,
      height: 64,
    });
    expect(getExpandedSize('pill', 128)).toEqual({ width: EXPANDED_RECTANGLE_WIDTH, height: 128 });
  });

  it('keeps the container size, which ignores display height', () => {
    expect(getExpandedSize('container', 64)).toEqual({
      width: DEFAULT_CONTAINER_WIDTH,
      height: DEFAULT_CONTAINER_HEIGHT,
    });
  });
});

describe('getNodeFallbackSize', () => {
  const input = (id: string) => ({ id, type: 'target' as const, handleType: 'input' as const });
  const manifest = (
    display: Partial<NodeManifest['display']>,
    handleConfiguration: NodeManifest['handleConfiguration'] = []
  ) => ({ display: { label: 'Node', ...display }, handleConfiguration }) as NodeManifest;
  const node = (display?: Record<string, unknown>): Node => ({
    id: 'n',
    position: { x: 0, y: 0 },
    data: display ? { display } : {},
  });

  it("uses the node's own display height over its manifest's", () => {
    expect(
      getNodeFallbackSize(node({ height: 64 }), manifest({ shape: 'rectangle', height: 128 }))
    ).toEqual({ width: EXPANDED_RECTANGLE_WIDTH, height: 64 });
  });

  it("falls back to the manifest's height, then to 96", () => {
    expect(getNodeFallbackSize(node(), manifest({ shape: 'pill', height: 128 }))).toEqual({
      width: EXPANDED_RECTANGLE_WIDTH,
      height: 128,
    });
    expect(getNodeFallbackSize(node({ height: undefined }), manifest({ shape: 'square' }))).toEqual(
      {
        width: COLLAPSED_NODE_SIZE,
        height: 96,
      }
    );
  });

  it("uses the node's own display shape over its manifest's", () => {
    expect(
      getNodeFallbackSize(node({ shape: 'rectangle' }), manifest({ shape: 'square', height: 64 }))
    ).toEqual({ width: EXPANDED_RECTANGLE_WIDTH, height: 64 });
  });

  it('ignores display height on a square or circle', () => {
    expect(getNodeFallbackSize(node(), manifest({ shape: 'square', height: 64 }))).toEqual({
      width: COLLAPSED_NODE_SIZE,
      height: 96,
    });
    expect(getNodeFallbackSize(node(), manifest({ shape: 'circle', height: 128 }))).toEqual({
      width: COLLAPSED_NODE_SIZE,
      height: 96,
    });
  });

  it('grows to the height its side handles need', () => {
    const twoLeft = [{ position: 'left' as const, handles: [input('a'), input('b')] }];
    expect(
      getNodeFallbackSize(node(), manifest({ shape: 'rectangle', height: 64 }, twoLeft))
    ).toEqual({ width: EXPANDED_RECTANGLE_WIDTH, height: 96 });

    const threeRight = [
      { position: 'right' as const, handles: [input('a'), input('b'), input('c')] },
    ];
    expect(getNodeFallbackSize(node(), manifest({ shape: 'rectangle' }, threeRight))).toEqual({
      width: EXPANDED_RECTANGLE_WIDTH,
      height: 128,
    });
  });

  it('counts only visible side handles, and not top or bottom ones', () => {
    const handles = [
      { position: 'left' as const, handles: [input('a'), { ...input('b'), visible: false }] },
      { position: 'top' as const, handles: [input('c'), input('d'), input('e')] },
    ];
    expect(
      getNodeFallbackSize(node(), manifest({ shape: 'rectangle', height: 64 }, handles))
    ).toEqual({
      width: EXPANDED_RECTANGLE_WIDTH,
      height: 64,
    });
  });

  it('copes with a node without a manifest', () => {
    expect(getNodeFallbackSize(node(), undefined)).toEqual({ width: 96, height: 96 });
  });

  it("counts a node's own handle configuration, with or without a manifest", () => {
    const threeRight = [
      { position: 'right' as const, handles: [input('a'), input('b'), input('c')] },
    ];
    const withHandles: Node = {
      id: 'n',
      position: { x: 0, y: 0 },
      data: { handleConfigurations: threeRight },
    };
    expect(getNodeFallbackSize(withHandles, undefined)).toEqual({ width: 96, height: 128 });
    expect(getNodeFallbackSize(withHandles, manifest({ shape: 'rectangle', height: 64 }))).toEqual({
      width: EXPANDED_RECTANGLE_WIDTH,
      height: 128,
    });
  });
});

describe('getSideHandleFloor', () => {
  const handle = (id: string) => ({ id, type: 'target' as const, handleType: 'input' as const });
  const group = (position: 'left' | 'right' | 'top' | 'bottom', count: number) => ({
    position,
    handles: Array.from({ length: count }, (_, i) => handle(`${position}-${i}`)),
  });

  it.each([
    [0, 32],
    [1, 64],
    [2, 96],
    [3, 128],
  ])('needs two grid spaces per handle plus padding: %i handles → %ipx', (count, height) => {
    expect(getSideHandleFloor([group('left', count)])).toBe(height);
  });

  it('takes the busier of the left and right sides', () => {
    expect(getSideHandleFloor([group('left', 1), group('right', 3)])).toBe(128);
  });

  it('skips hidden groups', () => {
    expect(getSideHandleFloor([{ ...group('left', 3), visible: false }])).toBe(32);
  });
});
