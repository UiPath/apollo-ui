import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions, bubbleVariants } from './bubble';

describe('Bubble', () => {
  it('renders content inside the bubble', () => {
    render(
      <Bubble data-testid="bubble">
        <BubbleContent>Hello</BubbleContent>
      </Bubble>
    );
    const bubble = screen.getByTestId('bubble');
    expect(bubble).toHaveAttribute('data-slot', 'bubble');
    expect(bubble).toHaveAttribute('data-variant', 'default');
    expect(bubble).toHaveAttribute('data-align', 'start');
    expect(screen.getByText('Hello')).toHaveAttribute('data-slot', 'bubble-content');
  });

  it.each([
    'default',
    'secondary',
    'muted',
    'outline',
    'ghost',
    'destructive',
  ] as const)('exposes the %s variant on data-variant and in the class list', (variant) => {
    render(
      <Bubble data-testid="bubble" variant={variant}>
        <BubbleContent>x</BubbleContent>
      </Bubble>
    );
    expect(screen.getByTestId('bubble')).toHaveAttribute('data-variant', variant);
    expect(screen.getByTestId('bubble').className).toBe(bubbleVariants({ variant }));
  });

  it('pins to the end when align="end"', () => {
    render(
      <Bubble data-testid="bubble" align="end">
        <BubbleContent>x</BubbleContent>
      </Bubble>
    );
    expect(screen.getByTestId('bubble')).toHaveAttribute('data-align', 'end');
  });

  it('renders BubbleContent as its child with asChild', () => {
    render(
      <Bubble>
        <BubbleContent asChild>
          <p>Paragraph</p>
        </BubbleContent>
      </Bubble>
    );
    const p = screen.getByText('Paragraph');
    expect(p.tagName).toBe('P');
    expect(p).toHaveAttribute('data-slot', 'bubble-content');
  });

  it('positions reactions by side and align', () => {
    render(
      <BubbleGroup data-testid="group">
        <Bubble>
          <BubbleContent>x</BubbleContent>
          <BubbleReactions data-testid="reactions" side="top" align="start">
            👍
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
    );
    expect(screen.getByTestId('group')).toHaveAttribute('data-slot', 'bubble-group');
    const reactions = screen.getByTestId('reactions');
    expect(reactions).toHaveAttribute('data-side', 'top');
    expect(reactions).toHaveAttribute('data-align', 'start');
    expect(reactions).toHaveClass('top-0', 'left-3');
  });

  it('forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Bubble ref={ref}>
        <BubbleContent>x</BubbleContent>
      </Bubble>
    );
    expect(ref.current).toHaveAttribute('data-slot', 'bubble');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Bubble>
        <BubbleContent>Hello</BubbleContent>
      </Bubble>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
