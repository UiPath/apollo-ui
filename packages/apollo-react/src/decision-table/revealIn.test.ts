import { afterEach, describe, expect, it, vi } from 'vitest';
import { revealIn } from './revealIn';

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  DOMRect.fromRect({ x: left, y: top, width, height });

const element = (box: DOMRect): Element => {
  const node = document.createElement('div');
  node.getBoundingClientRect = () => box;
  return node;
};

const scrollerAt = (scrollTop: number, scrollLeft: number, direction = 'ltr') => {
  const scroller = document.createElement('section');
  scroller.getBoundingClientRect = () => rect(100, 50, 800, 600);
  Object.defineProperties(scroller, {
    clientWidth: { value: 800 },
    clientHeight: { value: 600 },
    scrollTop: { value: scrollTop },
    scrollLeft: { value: scrollLeft },
  });
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    scrollPaddingTop: '48px',
    scrollPaddingInlineStart: '60px',
    scrollPaddingInlineEnd: '',
    direction,
  } as CSSStyleDeclaration);
  const scrollTo = vi.fn();
  scroller.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];
  return { scroller, scrollTo };
};

const card = (left: number, top: number, width = 400) => element(rect(left, top, width, 1000));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('revealIn', () => {
  it.each([
    ['left of the scrollport', 20, 160],
    ['to the right of it', 700, 500],
    ['under the launcher', 130, 270],
    ['already visible', 400, 300],
  ])('moves a card %s by the least sideways scroll inside the padding', (_, left, expected) => {
    const { scroller, scrollTo } = scrollerAt(1000, 300);
    const target = card(left, 400);
    revealIn(scroller, { vertical: target, horizontal: target, block: 'start' });
    expect(scrollTo).toHaveBeenCalledWith({ top: 1302, left: expected });
  });

  it('keeps a card clear of the inline-start padding on the right in RTL', () => {
    const { scroller, scrollTo } = scrollerAt(1000, 300, 'rtl');
    const target = card(700, 400);
    revealIn(scroller, { vertical: target, horizontal: target, block: 'start' });
    expect(scrollTo).toHaveBeenCalledWith({ top: 1302, left: 560 });
  });

  it('keeps the start clear of the launcher when the target is wider than the scrollport', () => {
    const { scroller, scrollTo } = scrollerAt(0, 0);
    const target = card(200, 50, 2000);
    revealIn(scroller, { vertical: target, horizontal: target, block: 'start' });
    expect(scrollTo).toHaveBeenCalledWith({ top: -48, left: 40 });
  });

  it('aligns the card top under a sticky heading the reader is partway past', () => {
    const { scroller, scrollTo } = scrollerAt(2000, 0);
    const cardBox = element(rect(200, -400, 400, 1500));
    const stuckHeading = element(rect(200, 98, 400, 40));
    revealIn(scroller, { vertical: cardBox, horizontal: stuckHeading, block: 'start' });
    expect(scrollTo).toHaveBeenCalledWith({ top: 1502, left: 0 });
  });

  it('centres a rule in the space below the top padding', () => {
    const { scroller, scrollTo } = scrollerAt(500, 0);
    const rule = element(rect(200, 950, 400, 40));
    revealIn(scroller, { vertical: rule, horizontal: rule, block: 'center' });
    expect(scrollTo).toHaveBeenCalledWith({ top: 1096, left: 0 });
  });
});
