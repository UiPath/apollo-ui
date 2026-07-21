import { renderHook } from '@testing-library/react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  getAdjacentRowId,
  isTypingTarget,
  type SequentialKeyboardRow,
  toggleCollapsedStepIds,
  useSequentialKeyboard,
} from './useSequentialKeyboard';

function makeRow(overrides: Partial<SequentialKeyboardRow> = {}): SequentialKeyboardRow {
  return { nodeId: 'a', collapsible: false, collapsed: false, ...overrides };
}

function makeKeyEvent(
  key: string,
  target: EventTarget = document.body,
  altKey = false
): ReactKeyboardEvent {
  return {
    key,
    target,
    altKey,
    preventDefault: vi.fn(),
  } as unknown as ReactKeyboardEvent;
}

describe('isTypingTarget', () => {
  it('is false for a plain div', () => {
    expect(isTypingTarget(document.createElement('div'))).toBe(false);
  });

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])('is true for a %s element', (tag) => {
    expect(isTypingTarget(document.createElement(tag))).toBe(true);
  });

  it('is true for a contenteditable element', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'isContentEditable', { value: true });
    expect(isTypingTarget(div)).toBe(true);
  });

  it('is false for null', () => {
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('getAdjacentRowId', () => {
  const rows = [{ nodeId: 'a' }, { nodeId: 'b' }, { nodeId: 'c' }];

  it('returns the next row after the selected one', () => {
    expect(getAdjacentRowId(rows, 'a', 'next')).toBe('b');
  });

  it('returns the previous row before the selected one', () => {
    expect(getAdjacentRowId(rows, 'c', 'prev')).toBe('b');
  });

  it('returns undefined past the last row (no wraparound)', () => {
    expect(getAdjacentRowId(rows, 'c', 'next')).toBeUndefined();
  });

  it('returns undefined before the first row (no wraparound)', () => {
    expect(getAdjacentRowId(rows, 'a', 'prev')).toBeUndefined();
  });

  it('jumps to the first row on next when nothing is selected', () => {
    expect(getAdjacentRowId(rows, undefined, 'next')).toBe('a');
  });

  it('jumps to the last row on prev when nothing is selected', () => {
    expect(getAdjacentRowId(rows, undefined, 'prev')).toBe('c');
  });

  it('returns undefined for an empty row list', () => {
    expect(getAdjacentRowId([], undefined, 'next')).toBeUndefined();
  });
});

describe('toggleCollapsedStepIds', () => {
  it('adds the id when collapsing', () => {
    expect(toggleCollapsedStepIds(new Set(['x']), 'a', true).sort()).toEqual(['a', 'x']);
  });

  it('removes the id when expanding', () => {
    expect(toggleCollapsedStepIds(new Set(['a', 'x']), 'a', false)).toEqual(['x']);
  });
});

describe('useSequentialKeyboard', () => {
  it('ignores keys entirely while the event target is a typing surface', () => {
    const onSelectNode = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' }), makeRow({ nodeId: 'b' })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode,
      })
    );

    result.current.onKeyDown(makeKeyEvent('ArrowDown', document.createElement('input')));
    expect(onSelectNode).not.toHaveBeenCalled();
  });

  it('moves selection to the next row on ArrowDown and prevents default', () => {
    const onSelectNode = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' }), makeRow({ nodeId: 'b' })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode,
      })
    );

    const event = makeKeyEvent('ArrowDown');
    result.current.onKeyDown(event);
    expect(onSelectNode).toHaveBeenCalledWith('b');
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('moves selection to the previous row on ArrowUp', () => {
    const onSelectNode = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' }), makeRow({ nodeId: 'b' })],
        selectedNodeId: 'b',
        collapsedStepIds: new Set(),
        onSelectNode,
      })
    );

    result.current.onKeyDown(makeKeyEvent('ArrowUp'));
    expect(onSelectNode).toHaveBeenCalledWith('a');
  });

  it('does not call onSelectNode at a boundary with no adjacent row', () => {
    const onSelectNode = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode,
      })
    );

    result.current.onKeyDown(makeKeyEvent('ArrowDown'));
    expect(onSelectNode).not.toHaveBeenCalled();
  });

  it('collapses the selected row on ArrowLeft when it is collapsible and expanded', () => {
    const onCollapsedStepIdsChange = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a', collapsible: true, collapsed: false })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode: vi.fn(),
        onCollapsedStepIdsChange,
      })
    );

    result.current.onKeyDown(makeKeyEvent('ArrowLeft'));
    expect(onCollapsedStepIdsChange).toHaveBeenCalledWith(['a']);
  });

  it('does nothing on ArrowLeft when the selected row is not collapsible', () => {
    const onCollapsedStepIdsChange = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a', collapsible: false })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode: vi.fn(),
        onCollapsedStepIdsChange,
      })
    );

    result.current.onKeyDown(makeKeyEvent('ArrowLeft'));
    expect(onCollapsedStepIdsChange).not.toHaveBeenCalled();
  });

  it('does nothing on ArrowLeft when the selected row is already collapsed', () => {
    const onCollapsedStepIdsChange = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a', collapsible: true, collapsed: true })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(['a']),
        onSelectNode: vi.fn(),
        onCollapsedStepIdsChange,
      })
    );

    result.current.onKeyDown(makeKeyEvent('ArrowLeft'));
    expect(onCollapsedStepIdsChange).not.toHaveBeenCalled();
  });

  it('expands the selected row on ArrowRight when it is collapsible and collapsed', () => {
    const onCollapsedStepIdsChange = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a', collapsible: true, collapsed: true })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(['a']),
        onSelectNode: vi.fn(),
        onCollapsedStepIdsChange,
      })
    );

    result.current.onKeyDown(makeKeyEvent('ArrowRight'));
    expect(onCollapsedStepIdsChange).toHaveBeenCalledWith([]);
  });

  it('fires onPrimaryAction with the selected node id on Enter when supplied', () => {
    const onPrimaryAction = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode: vi.fn(),
        onPrimaryAction,
      })
    );

    result.current.onKeyDown(makeKeyEvent('Enter'));
    expect(onPrimaryAction).toHaveBeenCalledWith('a');
  });

  it('is a no-op on Enter when no onPrimaryAction is supplied', () => {
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode: vi.fn(),
      })
    );

    const event = makeKeyEvent('Enter');
    expect(() => result.current.onKeyDown(event)).not.toThrow();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it.each([
    'Delete',
    'Backspace',
  ])('semantically deletes the selected row on %s in design mode', (key) => {
    const onDeleteNode = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode: vi.fn(),
        onDeleteNode,
        isDesignMode: true,
      })
    );

    const event = makeKeyEvent(key);
    result.current.onKeyDown(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onDeleteNode).toHaveBeenCalledWith('a');
  });

  it('does not delete outside design mode', () => {
    const onDeleteNode = vi.fn();
    const { result } = renderHook(() =>
      useSequentialKeyboard({
        rows: [makeRow({ nodeId: 'a' })],
        selectedNodeId: 'a',
        collapsedStepIds: new Set(),
        onSelectNode: vi.fn(),
        onDeleteNode,
        isDesignMode: false,
      })
    );

    const event = makeKeyEvent('Delete');
    result.current.onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onDeleteNode).not.toHaveBeenCalled();
  });

  describe('Alt+Arrow tree move', () => {
    it.each([
      ['ArrowUp', 'up'],
      ['ArrowDown', 'down'],
      ['ArrowLeft', 'outdent'],
      ['ArrowRight', 'indent'],
    ] as const)('calls onMoveNode with direction %s -> %s in design mode', (key, direction) => {
      const onMoveNode = vi.fn();
      const { result } = renderHook(() =>
        useSequentialKeyboard({
          rows: [makeRow({ nodeId: 'a' })],
          selectedNodeId: 'a',
          collapsedStepIds: new Set(),
          onSelectNode: vi.fn(),
          onMoveNode,
          isDesignMode: true,
        })
      );

      const event = makeKeyEvent(key, document.body, true);
      result.current.onKeyDown(event);
      expect(onMoveNode).toHaveBeenCalledWith('a', direction);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not call onMoveNode outside design mode, and does not fall through to plain navigation', () => {
      const onMoveNode = vi.fn();
      const onSelectNode = vi.fn();
      const { result } = renderHook(() =>
        useSequentialKeyboard({
          rows: [makeRow({ nodeId: 'a' }), makeRow({ nodeId: 'b' })],
          selectedNodeId: 'a',
          collapsedStepIds: new Set(),
          onSelectNode,
          onMoveNode,
          isDesignMode: false,
        })
      );

      result.current.onKeyDown(makeKeyEvent('ArrowDown', document.body, true));
      expect(onMoveNode).not.toHaveBeenCalled();
      expect(onSelectNode).not.toHaveBeenCalled();
    });

    it('does not call onMoveNode with no row selected', () => {
      const onMoveNode = vi.fn();
      const { result } = renderHook(() =>
        useSequentialKeyboard({
          rows: [makeRow({ nodeId: 'a' })],
          selectedNodeId: undefined,
          collapsedStepIds: new Set(),
          onSelectNode: vi.fn(),
          onMoveNode,
          isDesignMode: true,
        })
      );

      result.current.onKeyDown(makeKeyEvent('ArrowUp', document.body, true));
      expect(onMoveNode).not.toHaveBeenCalled();
    });

    it('plain (non-Alt) ArrowUp/Down/Left/Right still navigate/collapse exactly as before', () => {
      const onSelectNode = vi.fn();
      const onMoveNode = vi.fn();
      const { result } = renderHook(() =>
        useSequentialKeyboard({
          rows: [makeRow({ nodeId: 'a' }), makeRow({ nodeId: 'b' })],
          selectedNodeId: 'a',
          collapsedStepIds: new Set(),
          onSelectNode,
          onMoveNode,
          isDesignMode: true,
        })
      );

      result.current.onKeyDown(makeKeyEvent('ArrowDown'));
      expect(onSelectNode).toHaveBeenCalledWith('b');
      expect(onMoveNode).not.toHaveBeenCalled();
    });

    it('ignores Alt+Arrow entirely while the event target is a typing surface', () => {
      const onMoveNode = vi.fn();
      const { result } = renderHook(() =>
        useSequentialKeyboard({
          rows: [makeRow({ nodeId: 'a' })],
          selectedNodeId: 'a',
          collapsedStepIds: new Set(),
          onSelectNode: vi.fn(),
          onMoveNode,
          isDesignMode: true,
        })
      );

      result.current.onKeyDown(makeKeyEvent('ArrowUp', document.createElement('textarea'), true));
      expect(onMoveNode).not.toHaveBeenCalled();
    });
  });
});
