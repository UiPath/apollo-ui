import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasViewMode } from './useCanvasViewMode';

// useStorageState prefixes every key with `ui-` (see utils/Storage.ts), so tests
// seed the raw localStorage entry the same way the hook will read it.
const storageKey = 'test-canvas.view';
const prefixedKey = `ui-${storageKey}`;

describe('useCanvasViewMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to the initial view when nothing is stored', () => {
    const { result } = renderHook(() => useCanvasViewMode(storageKey));

    expect(result.current[0]).toBe('flow');
  });

  it('honours an explicit initial view', () => {
    const { result } = renderHook(() => useCanvasViewMode(storageKey, 'sequential'));

    expect(result.current[0]).toBe('sequential');
  });

  it('persists the chosen view and restores it on a later mount', () => {
    const { result, unmount } = renderHook(() => useCanvasViewMode(storageKey));

    act(() => result.current[1]('sequential'));
    expect(result.current[0]).toBe('sequential');
    unmount();

    const remounted = renderHook(() => useCanvasViewMode(storageKey));
    expect(remounted.result.current[0]).toBe('sequential');
  });

  it('reads a valid stored view written by a previous session', () => {
    localStorage.setItem(prefixedKey, JSON.stringify('sequential'));

    const { result } = renderHook(() => useCanvasViewMode(storageKey));

    expect(result.current[0]).toBe('sequential');
  });

  describe('untrusted stored values', () => {
    // localStorage is shared, mutable and outlives any one version of this
    // package, so the stored string is input rather than a CanvasView. Each case
    // below must degrade to `initial` rather than being handed to the canvas,
    // which would render neither view's node types.
    it.each([
      ['a retired or unknown view name', JSON.stringify('kanban')],
      ['a non-string value', JSON.stringify(42)],
      ['null', JSON.stringify(null)],
      ['an object', JSON.stringify({ view: 'sequential' })],
      ['unparseable JSON', '{not json'],
    ])('falls back to the initial view for %s', (_label, stored) => {
      localStorage.setItem(prefixedKey, stored);

      const { result } = renderHook(() => useCanvasViewMode(storageKey, 'sequential'));

      expect(result.current[0]).toBe('sequential');
      // The fallback is not sticky: a stored value the hook rejects must not stop
      // the user from choosing a view.
      act(() => result.current[1]('flow'));
      expect(result.current[0]).toBe('flow');
    });
  });
});
