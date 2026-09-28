import { render as bareRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { buildJsonTree } from './buildJsonTree';
import { JsonTree } from './JsonTree';
import { ROW_MIN_HEIGHT_PX } from './JsonTreeRow';

interface VirtualizerOptions {
  count: number;
  getItemKey?: (index: number) => string | number;
  scrollMargin?: number;
  getScrollElement: () => Element | null;
}

const WINDOW_SIZE = 3;
const virtualizerCalls: VirtualizerOptions[] = [];
// What `getScrollElement` resolved to each time the virtualizer would have
// subscribed. See the mock below.
const attachedScrollElements: (Element | null)[] = [];
// Driven per test: where the window sits, and whether a scroll is in flight.
let windowStart = 0;
let isScrolling = false;

// The virtualizer needs a laid-out scroll element, which happy-dom has none of.
// Standing in for it with a movable window exercises the tree's side of the
// contract: what it hands the virtualizer and what it does with the items back.
vi.mock('@tanstack/react-virtual', async () => {
  const { useLayoutEffect } = await import('react');
  return {
    useVirtualizer: (options: VirtualizerOptions) => {
      virtualizerCalls.push(options);
      // The real adapter resolves the scroll element in a layout effect after
      // every render and subscribes only when it changed, so an element that is
      // still null on the mount pass is never observed and no row is ever placed.
      useLayoutEffect(() => {
        attachedScrollElements.push(options.getScrollElement());
      });
      const scrollMargin = options.scrollMargin ?? 0;
      const measure = (index: number) => ({
        index,
        key: options.getItemKey?.(index) ?? index,
        start: scrollMargin + index * ROW_MIN_HEIGHT_PX,
        end: scrollMargin + (index + 1) * ROW_MIN_HEIGHT_PX,
        size: ROW_MIN_HEIGHT_PX,
        lane: 0,
      });
      const windowed = Array.from(
        { length: Math.max(0, Math.min(WINDOW_SIZE, options.count - windowStart)) },
        (_, offset) => measure(windowStart + offset)
      );
      return {
        getVirtualItems: () => windowed,
        getTotalSize: () => options.count * ROW_MIN_HEIGHT_PX,
        measureElement: () => {},
        measurementsCache: Array.from({ length: options.count }, (_, index) => measure(index)),
        options: { scrollMargin },
        scrollElement: null,
        isScrolling,
      };
    },
  };
});

/** happy-dom reports every rect as zero, so the offsets the effect reads are stubbed in. */
function stubOffsets(
  container: HTMLElement,
  scroller: HTMLElement,
  tops: { container: number; scroller: number; scrollTop: number }
) {
  container.getBoundingClientRect = () => ({ top: tops.container }) as DOMRect;
  scroller.getBoundingClientRect = () => ({ top: tops.scroller }) as DOMRect;
  Object.defineProperty(scroller, 'scrollTop', { value: tops.scrollTop, configurable: true });
}

const lastScrollMargin = () => virtualizerCalls.at(-1)?.scrollMargin;

const FIELD_COUNT = 40;
const value = Object.fromEntries(
  Array.from({ length: FIELD_COUNT }, (_, index) => [`field${index}`, `value${index}`])
);
const nodes = buildJsonTree({ value });

describe('JsonTree', () => {
  beforeEach(() => {
    virtualizerCalls.length = 0;
    attachedScrollElements.length = 0;
    windowStart = 0;
    isScrolling = false;
  });

  it('mounts every row by default', () => {
    render(<JsonTree nodes={nodes} readOnly />);

    expect(screen.getByText('field0')).toBeInTheDocument();
    expect(screen.getByText(`field${FIELD_COUNT - 1}`)).toBeInTheDocument();
  });

  it('mounts only the rows the virtualizer reports when virtualized', () => {
    render(<JsonTree nodes={nodes} readOnly virtualized />);

    expect(screen.getByText('field0')).toBeInTheDocument();
    expect(screen.getByText(`field${WINDOW_SIZE - 1}`)).toBeInTheDocument();
    expect(screen.queryByText(`field${WINDOW_SIZE}`)).not.toBeInTheDocument();
  });

  it('reserves the full height and positions each row at its offset', () => {
    render(<JsonTree nodes={nodes} readOnly virtualized />);

    const rowHost = screen.getByText('field1').closest('[data-index]') as HTMLElement;
    expect(rowHost.dataset.index).toBe('1');
    expect(rowHost.style.transform).toBe(`translateY(${ROW_MIN_HEIGHT_PX}px)`);
    expect((rowHost.parentElement as HTMLElement).style.height).toBe(
      `${FIELD_COUNT * ROW_MIN_HEIGHT_PX}px`
    );
  });

  // Rendered without the shared i18n provider: activating it re-renders the tree
  // a second time, which resolves the box by chance and hides the defect below.
  it('re-renders to hand the virtualizer its own scroll box on mount', () => {
    const { container } = bareRender(<JsonTree nodes={nodes} readOnly virtualized />);

    // A parent's ref is assigned only after its children's layout effects have
    // run, so reading the box through a ref leaves it null for the whole mount
    // and the sequence below stops at the first entry. The virtualizer
    // subscribes only when the element changed, so it would then never observe
    // anything, keep a zero viewport, and window no rows at all — until some
    // unrelated re-render happened to come along. Remounting the tree (switching
    // a tab away and back) lands in exactly that state.
    expect(attachedScrollElements).toEqual([null, container.firstElementChild]);
  });

  it('caps its own scroll box at the viewport so rows out of view never mount', () => {
    const { container: plain } = render(<JsonTree nodes={nodes} readOnly />);
    const { container: virtual } = render(<JsonTree nodes={nodes} readOnly virtualized />);

    expect((plain.querySelector('.overflow-y-auto') as HTMLElement).className).not.toContain(
      'max-h-screen'
    );
    const scrollBox = virtual.querySelector('.overflow-y-auto') as HTMLElement;
    expect(scrollBox.className).toContain('max-h-screen');
    expect(scrollBox.className).toContain('[overflow-anchor:none]');
  });

  it('grows to its content and scrolls with the given ancestor instead of its own box', () => {
    const scroller = document.createElement('div');
    const { container } = render(
      <JsonTree nodes={nodes} readOnly virtualized scrollElement={scroller} />
    );

    // Nothing here may scroll or be capped, or the ancestor's scrollbar would be the second one
    // and the virtualizer would listen to an element the user is not scrolling.
    const treeBox = container.firstElementChild as HTMLElement;
    expect(treeBox.className).not.toContain('overflow-y-auto');
    expect(treeBox.className).not.toContain('h-full');
    expect(treeBox.className).not.toContain('max-h-screen');
    // Offsets stay relative to the tree: the virtualizer's start includes the scroll margin, the row subtracts it.
    const rowHost = screen.getByText('field1').closest('[data-index]') as HTMLElement;
    expect(rowHost.style.transform).toBe(`translateY(${ROW_MIN_HEIGHT_PX}px)`);
  });

  it('measures how far it sits down the ancestor scroller and passes that as the margin', () => {
    const scroller = document.createElement('div');
    // A fresh element each time: React skips re-rendering a referentially identical one.
    const view = () => <JsonTree nodes={nodes} readOnly virtualized scrollElement={scroller} />;
    const { container, rerender } = render(view());
    expect(lastScrollMargin()).toBe(0);

    stubOffsets(container.firstElementChild as HTMLElement, scroller, {
      container: 200,
      scroller: 50,
      scrollTop: 10,
    });
    rerender(view());

    // 200 - 50 + 10: the tree's top within the scroller's content.
    expect(lastScrollMargin()).toBe(160);
  });

  it('drops the margin when the ancestor scroller goes away', () => {
    const scroller = document.createElement('div');
    const { container, rerender } = render(
      <JsonTree nodes={nodes} readOnly virtualized scrollElement={scroller} />
    );
    stubOffsets(container.firstElementChild as HTMLElement, scroller, {
      container: 200,
      scroller: 50,
      scrollTop: 10,
    });
    rerender(<JsonTree nodes={nodes} readOnly virtualized scrollElement={scroller} />);
    expect(lastScrollMargin()).toBe(160);

    // A stale margin here would shift every measurement while the offset restarts at 0.
    rerender(<JsonTree nodes={nodes} readOnly virtualized scrollElement={null} />);

    expect(lastScrollMargin()).toBe(0);
  });

  it('does not re-measure mid-scroll', () => {
    const scroller = document.createElement('div');
    const view = () => <JsonTree nodes={nodes} readOnly virtualized scrollElement={scroller} />;
    const { container, rerender } = render(view());
    stubOffsets(container.firstElementChild as HTMLElement, scroller, {
      container: 200,
      scroller: 50,
      scrollTop: 10,
    });
    isScrolling = true;
    rerender(view());

    // Reading rects on every tick would force layout, and the offset cannot change while scrolling.
    expect(lastScrollMargin()).toBe(0);
  });

  it('keeps the row being edited mounted after the window moves past it', async () => {
    const onEdit = vi.fn();
    const view = () => <JsonTree nodes={nodes} virtualized onEdit={onEdit} />;
    const { rerender } = render(view());

    await userEvent.click(screen.getByRole('button', { name: 'Edit value of field0' }));
    expect(screen.getByDisplayValue('value0')).toBeInTheDocument();

    windowStart = 20;
    rerender(view());

    // The window really moved: field0's neighbours are gone and the new range is mounted.
    expect(screen.getByText('field20')).toBeInTheDocument();
    expect(screen.queryByText('field1')).not.toBeInTheDocument();
    // An editor commits on blur, and React fires no focusout for a removed node, so unmounting
    // the row would silently drop what was typed.
    expect(screen.getByDisplayValue('value0')).toBeInTheDocument();

    // Pinned, it still sits at its own offset rather than inside the window, and stays ahead of
    // the window in the DOM so it tabs and reads in list order.
    const hosts = [...document.querySelectorAll('[data-index]')] as HTMLElement[];
    const indices = hosts.map((host) => Number(host.dataset.index));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    const pinned = hosts.find((host) => host.dataset.index === '0') as HTMLElement;
    expect(pinned.style.transform).toBe('translateY(0px)');
  });

  it('renders the pinned row once, with its draft intact, when the window returns to it', async () => {
    const onEdit = vi.fn();
    const view = () => <JsonTree nodes={nodes} virtualized onEdit={onEdit} />;
    const { rerender } = render(view());

    await userEvent.click(screen.getByRole('button', { name: 'Edit value of field0' }));
    await userEvent.clear(screen.getByDisplayValue('value0'));
    await userEvent.type(screen.getByRole('textbox'), 'typed while scrolling');

    windowStart = 20;
    rerender(view());
    windowStart = 0;
    rerender(view());

    // Back in the window it is an ordinary row again, not a second copy of itself, and the
    // draft survived both transitions because the row is keyed by path.
    expect(screen.getAllByText('field0')).toHaveLength(1);
    expect(screen.getByDisplayValue('typed while scrolling')).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('renders each row once when a value is refreshed under an open editor', async () => {
    const onEdit = vi.fn();
    const view = (tree: typeof nodes) => <JsonTree nodes={tree} virtualized onEdit={onEdit} />;
    const { rerender } = render(view(nodes));
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of field0' }));
    windowStart = 20;
    rerender(view(nodes));

    // A poll rebuilds the nodes while the row stays pinned: same paths, new objects.
    rerender(view(buildJsonTree({ value })));

    expect(screen.getAllByText('field0')).toHaveLength(1);
    expect(screen.getByDisplayValue('value0')).toBeInTheDocument();
  });

  it('keys rows by their new path after the rows reorder', () => {
    const reordered = buildJsonTree({ value: { later: 'x', ...value } });
    const { rerender } = render(<JsonTree nodes={nodes} readOnly virtualized />);
    expect(virtualizerCalls.at(-1)?.getItemKey?.(0)).toBe('field0');

    rerender(<JsonTree nodes={reordered} readOnly virtualized />);

    expect(virtualizerCalls.at(-1)?.getItemKey?.(0)).toBe('later');
  });

  it('keys rows by path so row state survives the window moving', () => {
    render(<JsonTree nodes={nodes} readOnly virtualized />);

    const options = virtualizerCalls.at(-1);
    expect(options?.count).toBe(FIELD_COUNT);
    expect(options?.getItemKey?.(1)).toBe('field1');
  });
});
