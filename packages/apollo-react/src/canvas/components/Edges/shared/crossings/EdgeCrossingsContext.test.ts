import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Point } from '../types';
import { EdgeCrossingsStore } from './EdgeCrossingsContext';

/** A horizontal line at y=50 and a vertical line at x=50 forming a plain X. */
const horizontal: Point[] = [
  { x: 0, y: 50 },
  { x: 100, y: 50 },
];
const vertical: Point[] = [
  { x: 50, y: 0 },
  { x: 50, y: 100 },
];

/** A fresh array of the same positions, as a re-render would hand over. */
const rebuilt = (points: Point[]): Point[] => points.map((p) => ({ x: p.x, y: p.y }));

/** Let the store's coalescing microtask run. */
const drain = () => Promise.resolve();

function crossedStore(): EdgeCrossingsStore {
  const store = new EdgeCrossingsStore();
  store.register('h', horizontal);
  store.register('v', vertical);
  return store;
}

describe('EdgeCrossingsStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives the crossing once the coalescing microtask drains', async () => {
    const store = crossedStore();
    expect(store.getSnapshot('h')).toEqual([]);

    await drain();

    expect(store.getSnapshot('h')).toEqual([{ segmentIndex: 0, point: { x: 50, y: 50 } }]);
    expect(store.getSnapshot('v')).toEqual([]);
  });

  it('drops a re-registration that repeats the stored positions', async () => {
    const store = crossedStore();
    await drain();

    const schedule = vi.spyOn(globalThis, 'queueMicrotask');
    store.register('h', rebuilt(horizontal));

    expect(schedule).not.toHaveBeenCalled();
  });

  it('keeps snapshot identity across a no-op registration', async () => {
    const store = crossedStore();
    await drain();
    const before = store.getSnapshot('h');

    store.register('h', rebuilt(horizontal));
    await drain();

    expect(store.getSnapshot('h')).toBe(before);
  });

  it('recomputes when the polyline actually moves', async () => {
    const store = crossedStore();
    await drain();

    const schedule = vi.spyOn(globalThis, 'queueMicrotask');
    store.register('h', [
      { x: 0, y: 70 },
      { x: 100, y: 70 },
    ]);

    expect(schedule).toHaveBeenCalledTimes(1);
    await drain();
    expect(store.getSnapshot('h')).toEqual([{ segmentIndex: 0, point: { x: 50, y: 70 } }]);
  });

  it('notifies only the edges whose own jumps changed', async () => {
    const store = crossedStore();
    await drain();

    const onHorizontal = vi.fn();
    const onVertical = vi.fn();
    store.subscribe('h', onHorizontal);
    store.subscribe('v', onVertical);

    // Slide the vertical across to x=70, moving the horizontal's notch with it.
    store.register('v', [
      { x: 70, y: 0 },
      { x: 70, y: 100 },
    ]);
    await drain();

    expect(onHorizontal).toHaveBeenCalledTimes(1);
    expect(onVertical).not.toHaveBeenCalled();
    expect(store.getSnapshot('h')).toEqual([{ segmentIndex: 0, point: { x: 70, y: 50 } }]);
  });

  it('withdraws an edge and clears the jumps that depended on it', async () => {
    const store = crossedStore();
    await drain();

    store.unregister('v');
    await drain();

    expect(store.getSnapshot('h')).toEqual([]);
  });
});
