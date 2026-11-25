import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeAnimator } from './animate-nodes';

const node = (id: string, x: number, y = 0, extra: Partial<Node> = {}): Node => ({
  id,
  position: { x, y },
  data: {},
  ...extra,
});

let reducedMotion = false;
let now = 0;
let queued: FrameRequestCallback[] = [];

const runFrame = (at: number) => {
  now = at;
  const callbacks = queued;
  queued = [];
  for (const callback of callbacks) callback(at);
};

beforeEach(() => {
  reducedMotion = false;
  now = 0;
  queued = [];
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => queued.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => {
    queued = [];
  });
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const animate = (...args: Parameters<NodeAnimator['animate']>) =>
  new NodeAnimator().animate(...args);

describe('NodeAnimator', () => {
  it('moves nodes along the easing curve and ends on the targets', async () => {
    const frames: Node[][] = [];
    const still = node('still', 5);
    const target = node('a', 100, 0, { width: 40 });
    const done = animate([node('a', 0), still, node('untouched', 7)], [target, still], {
      duration: 100,
      easing: (t) => t,
      onUpdate: (nodes) => frames.push(nodes),
    });

    runFrame(50);
    runFrame(100);

    await expect(done).resolves.toBe(true);
    expect(frames[0]?.[0]).toMatchObject({ position: { x: 50, y: 0 }, width: 40 });
    expect(frames[0]?.[1]).toBe(still);
    expect(frames[0]?.[2]?.position.x).toBe(7);
    expect(frames[1]?.[0]).toBe(target);
  });

  it('applies the targets in one update under reduced motion', async () => {
    reducedMotion = true;
    const onUpdate = vi.fn();
    const target = node('a', 100);

    await expect(animate([node('a', 0)], [target], { onUpdate })).resolves.toBe(true);

    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onUpdate.mock.calls[0]?.[0][0]).toBe(target);
    expect(queued).toHaveLength(0);
  });

  it('applies the targets in one update for a zero duration', async () => {
    const onUpdate = vi.fn();
    const target = node('a', 100);

    await expect(animate([node('a', 0)], [target], { duration: 0, onUpdate })).resolves.toBe(true);

    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onUpdate.mock.calls[0]?.[0]).toEqual([target]);
    expect(queued).toHaveLength(0);
  });

  it('shows a node that is only in the targets at its target from the first frame', async () => {
    const frames: Node[][] = [];
    const added = node('added', 300);
    const done = animate([node('a', 0)], [node('a', 100), added], {
      duration: 100,
      onUpdate: (nodes) => frames.push(nodes),
    });

    runFrame(50);
    runFrame(100);
    await done;

    expect(frames[0]?.map((n) => n.id)).toEqual(['a', 'added']);
    expect(frames[0]?.[1]).toBe(added);
    expect(frames[1]?.[1]).toBe(added);
  });

  it('resolves a cancelled animation with false and stops updating', async () => {
    const animator = new NodeAnimator();
    const onUpdate = vi.fn();
    const done = animator.animate([node('a', 0)], [node('a', 100)], { duration: 100, onUpdate });

    expect(animator.isAnimating).toBe(true);
    animator.cancel();
    await expect(done).resolves.toBe(false);
    runFrame(100);

    expect(animator.isAnimating).toBe(false);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('stops when onUpdate cancels the run', async () => {
    const animator = new NodeAnimator();
    const onUpdate = vi.fn(() => animator.cancel());
    const done = animator.animate([node('a', 0)], [node('a', 100)], { duration: 100, onUpdate });

    runFrame(50);

    await expect(done).resolves.toBe(false);
    expect(queued).toHaveLength(0);
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it('lets a run that onUpdate starts replace the current one', async () => {
    const animator = new NodeAnimator();
    const replaced = vi.fn();
    const first = animator.animate([node('a', 0)], [node('a', 100)], {
      duration: 100,
      onUpdate: () =>
        void animator.animate([node('b', 0)], [node('b', 100)], {
          duration: 100,
          onUpdate: replaced,
        }),
    });

    runFrame(50);
    await expect(first).resolves.toBe(false);
    expect(queued).toHaveLength(1);

    runFrame(200);
    expect(replaced).toHaveBeenCalledOnce();
    expect(animator.isAnimating).toBe(false);
  });

  it('rejects and stops when a frame throws', async () => {
    const animator = new NodeAnimator();
    const failure = new Error('update failed');
    const done = animator.animate([node('a', 0)], [node('a', 100)], {
      duration: 100,
      onUpdate: () => {
        throw failure;
      },
    });

    runFrame(50);

    await expect(done).rejects.toBe(failure);
    expect(animator.isAnimating).toBe(false);
    expect(queued).toHaveLength(0);
  });

  it('rejects instead of throwing when an instant update throws', async () => {
    const failure = new Error('update failed');
    const done = animate([node('a', 0)], [node('a', 100)], {
      duration: 0,
      onUpdate: () => {
        throw failure;
      },
    });

    await expect(done).rejects.toBe(failure);
  });
});
