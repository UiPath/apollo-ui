import { describe, expect, it } from 'vitest';
import { NODE_BADGE_INSET_CIRCLE, NODE_BADGE_INSET_SQUARE } from '../../constants';
import type { NodeShape } from '../../schema';
import { render } from '../../utils/testing';
import { BaseBadgeSlot } from './BaseNodeBadgeSlot';
import { getNodeBadgeInset } from './BaseNodeBadgeSlot.utils';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const POSITIONS: Position[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const ROUND_SHAPES = ['circle', 'pill'] as const;
const CORNERED_SHAPES = ['square', 'rectangle', 'clipped', 'document'] as const;

const slotStyle = (shape: NodeShape, position: Position) => {
  const { container } = render(
    <BaseBadgeSlot position={position} shape={shape}>
      <span />
    </BaseBadgeSlot>
  );
  return (container.firstElementChild as HTMLElement).style;
};

const expectInset = (shape: NodeShape, position: Position, inset: number) => {
  const style = slotStyle(shape, position);
  const [vertical, horizontal] = position.split('-') as ['top' | 'bottom', 'left' | 'right'];
  expect(style[vertical]).toBe(`${inset}px`);
  expect(style[horizontal]).toBe(`${inset}px`);
};

describe('getNodeBadgeInset', () => {
  it.each(ROUND_SHAPES)('uses the circle inset for a %s', (shape) => {
    expect(getNodeBadgeInset(shape)).toBe(NODE_BADGE_INSET_CIRCLE);
  });

  it.each(CORNERED_SHAPES)('uses the square inset for a %s', (shape) => {
    expect(getNodeBadgeInset(shape)).toBe(NODE_BADGE_INSET_SQUARE);
  });

  it('uses the square inset when no shape is given', () => {
    expect(getNodeBadgeInset()).toBe(NODE_BADGE_INSET_SQUARE);
  });
});

describe('BaseBadgeSlot', () => {
  describe.each(POSITIONS)('%s', (position) => {
    it.each(ROUND_SHAPES)('keeps a badge inside the round end of a %s', (shape) => {
      expectInset(shape, position, NODE_BADGE_INSET_CIRCLE);
    });

    it.each(CORNERED_SHAPES)('sets a badge close to the corner of a %s', (shape) => {
      expectInset(shape, position, NODE_BADGE_INSET_SQUARE);
    });
  });

  it('uses an explicit inset on the sides of its corner', () => {
    const { container } = render(
      <BaseBadgeSlot position="bottom-right" shape="circle" inset={2}>
        <span />
      </BaseBadgeSlot>
    );
    const style = (container.firstElementChild as HTMLElement).style;

    expect(style.bottom).toBe('2px');
    expect(style.right).toBe('2px');
    expect(style.top).toBe('');
  });
});
