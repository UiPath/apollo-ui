import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NODE_BADGE_INSET_CIRCLE, NODE_BADGE_INSET_SQUARE } from '../../constants';
import { BaseBadgeSlot } from './BaseNodeBadgeSlot';

const slot = () => screen.getByText('badge').parentElement as HTMLElement;

describe('BaseBadgeSlot', () => {
  it('insets by the shape default', () => {
    const { unmount } = render(
      <BaseBadgeSlot position="top-left">
        <span>badge</span>
      </BaseBadgeSlot>
    );
    expect(slot().style.top).toBe(`${NODE_BADGE_INSET_SQUARE}px`);
    unmount();

    render(
      <BaseBadgeSlot position="top-left" shape="circle">
        <span>badge</span>
      </BaseBadgeSlot>
    );
    expect(slot().style.top).toBe(`${NODE_BADGE_INSET_CIRCLE}px`);
  });

  it('uses an explicit inset on the sides of its corner', () => {
    render(
      <BaseBadgeSlot position="bottom-right" shape="circle" inset={2}>
        <span>badge</span>
      </BaseBadgeSlot>
    );

    expect(slot().style.bottom).toBe('2px');
    expect(slot().style.right).toBe('2px');
    expect(slot().style.top).toBe('');
  });
});
