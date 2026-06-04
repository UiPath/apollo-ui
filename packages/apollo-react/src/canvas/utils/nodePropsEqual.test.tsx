import { memo } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { areNodePropsEqualIgnoringPosition } from './nodePropsEqual';
import { render } from './testing';

describe('areNodePropsEqualIgnoringPosition', () => {
  it('returns true for the same reference', () => {
    const props = { id: 'n1', selected: false };
    expect(areNodePropsEqualIgnoringPosition(props, props)).toBe(true);
  });

  it('treats props as equal when only positionAbsoluteX/Y differ', () => {
    expect(
      areNodePropsEqualIgnoringPosition(
        { id: 'n1', selected: false, positionAbsoluteX: 0, positionAbsoluteY: 0 },
        { id: 'n1', selected: false, positionAbsoluteX: 123, positionAbsoluteY: 456 }
      )
    ).toBe(true);
  });

  it('detects changes to a non-position prop', () => {
    expect(
      areNodePropsEqualIgnoringPosition(
        { id: 'n1', selected: false, positionAbsoluteX: 0, positionAbsoluteY: 0 },
        { id: 'n1', selected: true, positionAbsoluteX: 0, positionAbsoluteY: 0 }
      )
    ).toBe(false);
  });

  it('compares object props (data) by reference', () => {
    const data = { label: 'A' };

    // Same data reference + moved position => equal (the common drag case).
    expect(
      areNodePropsEqualIgnoringPosition(
        { data, positionAbsoluteX: 0, positionAbsoluteY: 0 },
        { data, positionAbsoluteX: 9, positionAbsoluteY: 9 }
      )
    ).toBe(true);

    // New data reference => not equal, even at the same position.
    expect(
      areNodePropsEqualIgnoringPosition(
        { data, positionAbsoluteX: 0, positionAbsoluteY: 0 },
        { data: { label: 'A' }, positionAbsoluteX: 0, positionAbsoluteY: 0 }
      )
    ).toBe(false);
  });

  it('returns false when the key sets differ but counts match', () => {
    expect(
      areNodePropsEqualIgnoringPosition(
        { id: 'n1', selected: false },
        { id: 'n1', dragging: false }
      )
    ).toBe(false);
  });

  it('returns false when a key is added or removed', () => {
    expect(areNodePropsEqualIgnoringPosition({ id: 'n1' }, { id: 'n1', selected: true })).toBe(
      false
    );
  });
});

/**
 * The behavioural guarantee: a node component memoised with this comparator
 * must NOT re-render when only its absolute position changes (what happens to
 * every child of a dragged container ~60fps), but MUST re-render when a real
 * prop such as `data` or `selected` changes.
 */
describe('areNodePropsEqualIgnoringPosition as a React.memo comparator', () => {
  interface DummyNodeProps {
    positionAbsoluteX: number;
    positionAbsoluteY: number;
    data: { label: string };
    selected: boolean;
  }

  const makeMemoNode = (onRender: () => void) => {
    const Inner = (_props: DummyNodeProps) => {
      onRender();
      return null;
    };
    return memo(Inner, areNodePropsEqualIgnoringPosition);
  };

  it('does not re-render when only positionAbsoluteX/Y change', () => {
    const onRender = vi.fn();
    const Node = makeMemoNode(onRender);
    const data = { label: 'A' };

    const { rerender } = render(
      <Node positionAbsoluteX={0} positionAbsoluteY={0} data={data} selected={false} />
    );
    expect(onRender).toHaveBeenCalledTimes(1);

    // Simulate consecutive drag frames: the parent moved, so this child's
    // absolute position changes while data/selection stay identical.
    rerender(<Node positionAbsoluteX={40} positionAbsoluteY={12} data={data} selected={false} />);
    rerender(<Node positionAbsoluteX={80} positionAbsoluteY={24} data={data} selected={false} />);

    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('re-renders when a non-position prop changes', () => {
    const onRender = vi.fn();
    const Node = makeMemoNode(onRender);
    const data = { label: 'A' };

    const { rerender } = render(
      <Node positionAbsoluteX={0} positionAbsoluteY={0} data={data} selected={false} />
    );
    expect(onRender).toHaveBeenCalledTimes(1);

    // Selection toggled => must re-render.
    rerender(<Node positionAbsoluteX={0} positionAbsoluteY={0} data={data} selected />);
    expect(onRender).toHaveBeenCalledTimes(2);

    // New data reference => must re-render.
    rerender(<Node positionAbsoluteX={0} positionAbsoluteY={0} data={{ label: 'B' }} selected />);
    expect(onRender).toHaveBeenCalledTimes(3);
  });
});
