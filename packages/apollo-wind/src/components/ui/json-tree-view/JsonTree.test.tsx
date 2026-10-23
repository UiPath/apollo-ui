import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildJsonTree } from './buildJsonTree';
import { JsonTreeView } from './JsonTree';
import type { PathSegment } from './JsonTree.types';
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

describe('JsonTreeView', () => {
  beforeEach(() => {
    virtualizerCalls.length = 0;
    attachedScrollElements.length = 0;
    windowStart = 0;
    isScrolling = false;
  });

  it('mounts every row by default', () => {
    render(<JsonTreeView nodes={nodes} readOnly />);

    expect(screen.getByText('field0')).toBeInTheDocument();
    expect(screen.getByText(`field${FIELD_COUNT - 1}`)).toBeInTheDocument();
  });

  it('mounts only the rows the virtualizer reports when virtualized', () => {
    render(<JsonTreeView nodes={nodes} readOnly virtualized />);

    expect(screen.getByText('field0')).toBeInTheDocument();
    expect(screen.getByText(`field${WINDOW_SIZE - 1}`)).toBeInTheDocument();
    expect(screen.queryByText(`field${WINDOW_SIZE}`)).not.toBeInTheDocument();
  });

  it('reserves the full height and positions each row at its offset', () => {
    render(<JsonTreeView nodes={nodes} readOnly virtualized />);

    const rowHost = screen.getByText('field1').closest('[data-index]') as HTMLElement;
    expect(rowHost.dataset.index).toBe('1');
    expect(rowHost.style.transform).toBe(`translateY(${ROW_MIN_HEIGHT_PX}px)`);
    expect((rowHost.parentElement as HTMLElement).style.height).toBe(
      `${FIELD_COUNT * ROW_MIN_HEIGHT_PX}px`
    );
  });

  // Rendered with no provider around it: an extra re-render (e.g. a provider
  // activating) would resolve the box by chance and hide the defect below.
  it('re-renders to hand the virtualizer its own scroll box on mount', () => {
    const { container } = render(<JsonTreeView nodes={nodes} readOnly virtualized />);

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
    const { container: plain } = render(<JsonTreeView nodes={nodes} readOnly />);
    const { container: virtual } = render(<JsonTreeView nodes={nodes} readOnly virtualized />);

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
      <JsonTreeView nodes={nodes} readOnly virtualized scrollElement={scroller} />
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
    const view = () => <JsonTreeView nodes={nodes} readOnly virtualized scrollElement={scroller} />;
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
      <JsonTreeView nodes={nodes} readOnly virtualized scrollElement={scroller} />
    );
    stubOffsets(container.firstElementChild as HTMLElement, scroller, {
      container: 200,
      scroller: 50,
      scrollTop: 10,
    });
    rerender(<JsonTreeView nodes={nodes} readOnly virtualized scrollElement={scroller} />);
    expect(lastScrollMargin()).toBe(160);

    // A stale margin here would shift every measurement while the offset restarts at 0.
    rerender(<JsonTreeView nodes={nodes} readOnly virtualized scrollElement={null} />);

    expect(lastScrollMargin()).toBe(0);
  });

  it('does not re-measure mid-scroll', () => {
    const scroller = document.createElement('div');
    const view = () => <JsonTreeView nodes={nodes} readOnly virtualized scrollElement={scroller} />;
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
    const view = () => <JsonTreeView nodes={nodes} virtualized onEdit={onEdit} />;
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
    const view = () => <JsonTreeView nodes={nodes} virtualized onEdit={onEdit} />;
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
    const view = (tree: typeof nodes) => <JsonTreeView nodes={tree} virtualized onEdit={onEdit} />;
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
    const { rerender } = render(<JsonTreeView nodes={nodes} readOnly virtualized />);
    expect(virtualizerCalls.at(-1)?.getItemKey?.(0)).toBe('field0');

    rerender(<JsonTreeView nodes={reordered} readOnly virtualized />);

    expect(virtualizerCalls.at(-1)?.getItemKey?.(0)).toBe('later');
  });

  it('keys rows by path so row state survives the window moving', () => {
    render(<JsonTreeView nodes={nodes} readOnly virtualized />);

    const options = virtualizerCalls.at(-1);
    expect(options?.count).toBe(FIELD_COUNT);
    expect(options?.getItemKey?.(1)).toBe('field1');
  });
});

describe('JsonTreeView pathForCopy', () => {
  // A flattened key with dots is bracket-quoted in `path`; `segments` keeps it whole.
  const dottedNodes = buildJsonTree({ value: { 'agent1.output.day': { name: 'Monday' } } });

  it('receives the unquoted segments alongside the path', async () => {
    const pathForCopy = vi.fn((_path: string, segments: PathSegment[]) => segments.join(' > '));
    const onCopy = vi.fn();
    const user = userEvent.setup();
    render(<JsonTreeView nodes={dottedNodes} readOnly pathForCopy={pathForCopy} onCopy={onCopy} />);

    expect(pathForCopy).toHaveBeenCalledWith('["agent1.output.day"].name', [
      'agent1.output.day',
      'name',
    ]);

    // The copy affordance and the clipboard text both use the transformed path.
    await user.click(
      screen.getByRole('button', { name: 'Copy path for agent1.output.day > name' })
    );
    await waitFor(() =>
      expect(onCopy).toHaveBeenCalledWith({
        kind: 'path',
        path: '["agent1.output.day"].name',
        text: 'agent1.output.day > name',
      })
    );
  });

  it('shows chevrons as state, not controls, when the host fixes expansion', () => {
    const nodes = buildJsonTree({ value: { config: { region: 'us-east' } } });
    const { rerender } = render(<JsonTreeView nodes={nodes} />);
    expect(screen.getByRole('button', { name: 'Collapse config' })).toBeDisabled();

    rerender(<JsonTreeView nodes={nodes} onToggleCollapsed={() => {}} />);
    expect(screen.getByRole('button', { name: 'Collapse config' })).toBeEnabled();
  });
});

describe('JsonTreeView row decorations and actions', () => {
  const nodes = buildJsonTree({ value: { node1: { output: 'done' } } });

  it('keeps a persistent action visible at rest, and others revealed on hover', () => {
    render(
      <JsonTreeView
        nodes={nodes}
        readOnly
        nodeActions={(node) =>
          node.path === 'node1'
            ? [
                { id: 'add', icon: <span />, label: 'Add', onSelect: () => {} },
                {
                  id: 'focus',
                  icon: <span />,
                  label: 'Focus',
                  persistent: true,
                  onSelect: () => {},
                },
              ]
            : undefined
        }
      />
    );

    expect(screen.getByRole('button', { name: 'Focus' })).toHaveClass('opacity-100');
    expect(screen.getByRole('button', { name: 'Add' })).not.toHaveClass('opacity-100');
    // Also revealed while the row, or anything in it, holds focus.
    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass(
      'group-hover:opacity-100',
      'group-focus-within/row:opacity-100'
    );
  });

  it('orders the trailing cluster as start actions, meta, then end actions', () => {
    render(
      <JsonTreeView
        nodes={nodes}
        readOnly
        decorateNode={(node) =>
          node.path === 'node1' ? { meta: <span data-testid="meta">(1)</span> } : undefined
        }
        nodeActions={(node) =>
          node.path === 'node1'
            ? [
                { id: 'add', icon: <span />, label: 'Add', onSelect: () => {} },
                {
                  id: 'focus',
                  icon: <span />,
                  label: 'Focus',
                  placement: 'start',
                  onSelect: () => {},
                },
              ]
            : undefined
        }
      />
    );

    const focus = screen.getByRole('button', { name: 'Focus' });
    const meta = screen.getByTestId('meta');
    const add = screen.getByRole('button', { name: 'Add' });
    expect(focus.compareDocumentPosition(meta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(meta.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('hides the value cell of a scalar row with hideValue', () => {
    render(
      <JsonTreeView
        nodes={buildJsonTree({ value: { trigger1: null } })}
        readOnly
        decorateNode={() => ({ hideValue: true })}
      />
    );

    expect(screen.queryByText('=')).toBeNull();
    expect(screen.queryByText('null')).toBeNull();
  });

  it('reveals a hover-only sublabel on row hover or focus', () => {
    render(
      <JsonTreeView
        nodes={nodes}
        readOnly
        decorateNode={(node) =>
          node.path === 'node1' ? { sublabel: 'node-id', sublabelOnHover: true } : undefined
        }
      />
    );

    expect(screen.getByText('node-id')).toHaveClass(
      'hidden',
      'group-hover:block',
      'group-focus-within/row:block'
    );
  });

  it('names a display label in full in the key tooltip', async () => {
    const user = userEvent.setup();
    render(
      <JsonTreeView
        nodes={nodes}
        readOnly
        decorateNode={(node) => (node.path === 'node1' ? { label: 'Message received' } : undefined)}
      />
    );

    await user.hover(screen.getByRole('button', { name: 'Copy path for node1' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Message received');
  });
});

describe('JsonTreeView keyboard (treegrid)', () => {
  const treeValue = { config: { region: 'us-east', retries: 3 }, mode: 'fast', tags: ['a'] };
  const treeNodes = buildJsonTree({ value: treeValue });

  /** Holds collapse state like a host would, so the arrow keys can expand and collapse. */
  function Harness(props: Partial<Parameters<typeof JsonTreeView>[0]>) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    return (
      <JsonTreeView
        nodes={treeNodes}
        collapsed={collapsed}
        onToggleCollapsed={(path) => setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }))}
        {...props}
      />
    );
  }

  const row = (path: string) =>
    screen.getAllByRole('row').find((element) => element.dataset.path === path) as HTMLElement;

  it('exposes the rows as a named tree grid with their level, position, and state', () => {
    render(<Harness readOnly />);

    const grid = screen.getByRole('treegrid', { name: 'JSON fields' });
    expect(grid).toHaveAttribute('aria-readonly', 'true');
    expect(grid).toHaveAttribute('aria-rowcount', '6');
    expect(row('config')).toHaveAttribute('aria-expanded', 'true');
    expect(row('config')).toHaveAttribute('aria-level', '1');
    expect(row('config.retries')).toHaveAttribute('aria-level', '2');
    expect(row('config.retries')).toHaveAttribute('aria-posinset', '2');
    expect(row('config.retries')).toHaveAttribute('aria-setsize', '2');
    expect(row('config.retries')).toHaveAttribute('aria-rowindex', '3');
    expect(row('mode')).not.toHaveAttribute('aria-expanded');
  });

  it('takes a host label over the default name', () => {
    render(<Harness aria-label="Output" />);
    expect(screen.getByRole('treegrid', { name: 'Output' })).toBeInTheDocument();
  });

  it('is a single Tab stop that starts on the first row', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    expect(row('config')).toHaveFocus();
    // Every other row, and every control in it, is out of the Tab order.
    expect(row('mode')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Copy path for mode' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });

  it('walks the rows with Up, Down, Home, and End', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(row('config.region')).toHaveFocus();
    expect(row('config.region')).toHaveAttribute('tabindex', '0');
    expect(row('config')).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{End}');
    expect(row('tags[0]')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(row('tags')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(row('config')).toHaveFocus();
  });

  it('collapses and expands with Left and Right, and climbs to the parent', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowLeft}');
    expect(row('config')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(row('config')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('region')).not.toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(row('config')).toHaveAttribute('aria-expanded', 'true');
    expect(row('config')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(row('config')).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves across a row with Left and Right, and keeps the cell on Up and Down', async () => {
    const user = userEvent.setup();
    render(<Harness onEdit={() => {}} />);

    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Copy path for config.region' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    const regionValue = screen.getByRole('button', { name: 'Edit value of region' });
    expect(regionValue).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Edit value of retries' })).toHaveFocus();

    await user.keyboard('{ArrowUp}{Home}');
    expect(screen.getByRole('button', { name: 'Copy path for config.region' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(row('config.region')).toHaveFocus();
  });

  it('lets Tab walk the focused row and then leave the tree', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness readOnly />
        <button type="button">after</button>
      </>
    );

    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy path for config' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy value of config' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
  });

  it('returns focus to the value after a keyboard commit or cancel', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onEdit={onEdit} />);

    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}{Enter}');
    expect(screen.getByDisplayValue('us-east')).toHaveFocus();

    // Arrow keys move the caret while editing, not the row.
    await user.keyboard('{ArrowDown}{ArrowLeft}');
    expect(screen.getByDisplayValue('us-east')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Edit value of region' })).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.clear(screen.getByDisplayValue('us-east'));
    await user.keyboard('eu-west{Enter}');
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'config.region' }),
      'eu-west'
    );
    expect(screen.getByRole('button', { name: 'Edit value of region' })).toHaveFocus();
  });

  it('returns focus to the control that opened the JSON editor', async () => {
    const user = userEvent.setup();
    render(<Harness onEdit={() => {}} />);

    await user.tab();
    await user.keyboard('{End}{ArrowUp}{ArrowRight}{End}{ArrowLeft}');
    const editJson = screen.getByRole('button', { name: 'Edit tags as JSON' });
    expect(editJson).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('textbox', { name: 'Edit JSON of tags' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(editJson).toHaveFocus();
  });

  it('moves rows with Down on a menu trigger instead of opening its menu', async () => {
    const enumNodes = buildJsonTree({
      value: { level: 'info', next: 'x' },
      schema: {
        type: 'object',
        properties: { level: { type: 'string', enum: ['info', 'warn'] }, next: { type: 'string' } },
      },
    });
    const user = userEvent.setup();
    render(<JsonTreeView nodes={enumNodes} onEdit={() => {}} />);

    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Edit value of level' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit value of next' })).toHaveFocus();
  });

  it('hands focus to the nearest visible ancestor when its row is collapsed away', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<JsonTreeView nodes={treeNodes} onToggleCollapsed={() => {}} />);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(row('config.region')).toHaveFocus();

    rerender(
      <JsonTreeView nodes={treeNodes} collapsed={{ config: true }} onToggleCollapsed={() => {}} />
    );
    expect(row('config')).toHaveFocus();
    expect(row('config')).toHaveAttribute('tabindex', '0');
  });

  it('mounts and focuses a row outside the virtual window', async () => {
    const user = userEvent.setup();
    render(<JsonTreeView nodes={nodes} readOnly virtualized />);

    await user.tab();
    await user.keyboard('{End}');
    // The window still sits at the top; the focused row is pinned at its own offset.
    expect(screen.getByText('field0')).toBeInTheDocument();
    expect(row(`field${FIELD_COUNT - 1}`)).toHaveFocus();
    expect(row(`field${FIELD_COUNT - 1}`)).toHaveAttribute('aria-rowindex', String(FIELD_COUNT));
  });
});

describe('JsonTreeView tab order', () => {
  const rowIn = (scope: HTMLElement, path: string) =>
    within(scope)
      .getAllByRole('row')
      .find((element) => element.dataset.path === path) as HTMLElement;

  it('keeps an open editor out of the Tab order once another row takes the stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <JsonTreeView
          nodes={buildJsonTree({ value: { a: 'x', config: { x: 1 }, b: 'y' } })}
          onEdit={() => {}}
        />
        <button type="button">after</button>
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Edit config as JSON' }));
    const editor = screen.getByRole('textbox', { name: 'Edit JSON of config' });
    expect(editor).toHaveFocus();

    await user.click(rowIn(document.body, 'a'));
    expect(editor).toHaveAttribute('tabindex', '-1');
    const visited: Element[] = [];
    const after = screen.getByRole('button', { name: 'after' });
    for (let step = 0; step < 15 && document.activeElement !== after; step += 1) {
      await user.tab();
      if (document.activeElement) visited.push(document.activeElement);
    }
    expect(after).toHaveFocus();
    expect(visited).not.toContain(editor);
  });

  it('takes a control a custom cell adds later out of the Tab order', async () => {
    let reveal: () => void = () => {};
    function LateButton() {
      const [shown, setShown] = useState(false);
      reveal = () => setShown(true);
      return shown ? <button type="button">late</button> : <span>loading</span>;
    }
    const user = userEvent.setup();
    render(
      <JsonTreeView
        nodes={buildJsonTree({ value: { a: 'x', b: 'y' } })}
        readOnly
        renderValue={(node) => (node.path === 'b' ? <LateButton /> : undefined)}
      />
    );

    await user.tab();
    act(() => reveal());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'late' })).toHaveAttribute('tabindex', '-1')
    );
  });

  it("restores a consumer control's own tabindex when its row takes the stop", async () => {
    const user = userEvent.setup();
    render(
      <JsonTreeView
        nodes={buildJsonTree({ value: { a: 'x', b: 'y' } })}
        readOnly
        renderValue={(node) =>
          node.path === 'b' ? (
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Stands in for a consumer's focusable cell.
            <span tabIndex={0}>custom</span>
          ) : undefined
        }
      />
    );
    const custom = screen.getByText('custom');
    expect(custom).toHaveAttribute('tabindex', '-1');

    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(custom).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowUp}');
    expect(custom).toHaveAttribute('tabindex', '-1');
  });

  it('returns to the last focused row when Tab comes back into the tree', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <JsonTreeView nodes={nodes} readOnly />
      </>
    );

    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(rowIn(document.body, 'field2')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'before' })).toHaveFocus();
    await user.tab();
    expect(rowIn(document.body, 'field2')).toHaveFocus();
  });

  it('keeps the Tab stop row mounted and tabbable after it scrolls out of the window', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<JsonTreeView nodes={nodes} readOnly virtualized />);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    windowStart = 20;
    rerender(<JsonTreeView nodes={nodes} readOnly virtualized />);

    expect(screen.queryByText('field2')).not.toBeInTheDocument();
    expect(rowIn(document.body, 'field1')).toHaveAttribute('tabindex', '0');
  });

  describe('a tree nested in a cell', () => {
    const innerNodes = buildJsonTree({ value: { b: 'inner b', z: 'inner z' } });
    function Nested() {
      return (
        <JsonTreeView
          aria-label="Outer"
          nodes={buildJsonTree({ value: { a: 'x', b: 'y', c: 'w' } })}
          readOnly
          renderValue={(node) =>
            node.path === 'a' ? (
              <JsonTreeView aria-label="Inner" nodes={innerNodes} readOnly />
            ) : undefined
          }
        />
      );
    }
    const outer = () => screen.getByRole('treegrid', { name: 'Outer' });
    const inner = () => screen.getByRole('treegrid', { name: 'Inner' });
    const outerRow = (path: string) =>
      within(outer())
        .getAllByRole('row')
        .find(
          (row) => row.dataset.path === path && row.closest('[role="treegrid"]') === outer()
        ) as HTMLElement;

    it('keeps its own arrow keys when its paths overlap the outer tree', async () => {
      const user = userEvent.setup();
      render(<Nested />);

      rowIn(inner(), 'b').focus();
      await user.keyboard('{ArrowDown}');
      expect(rowIn(inner(), 'z')).toHaveFocus();

      outerRow('a').focus();
      await user.keyboard('{ArrowDown}');
      expect(outerRow('b')).toHaveFocus();
    });

    it("doesn't step into the nested tree with the outer row's arrows", async () => {
      const user = userEvent.setup();
      render(<Nested />);

      outerRow('a').focus();
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
      expect(inner().contains(document.activeElement)).toBe(false);
    });

    it('leaves the Tab order with its outer row, and makes that row active when focused', async () => {
      const user = userEvent.setup();
      render(<Nested />);

      outerRow('b').focus();
      await waitFor(() => expect(outerRow('b')).toHaveAttribute('tabindex', '0'));
      for (const row of within(inner()).getAllByRole('row')) {
        expect(row).toHaveAttribute('tabindex', '-1');
      }
      for (const button of within(inner()).getAllByRole('button')) {
        expect(button).toHaveAttribute('tabindex', '-1');
      }

      await user.click(within(inner()).getByRole('button', { name: 'Copy path for z' }));
      expect(outerRow('a')).toHaveAttribute('tabindex', '0');
      expect(outerRow('b')).toHaveAttribute('tabindex', '-1');
    });
  });
});

describe('JsonTreeView keyboard edge cases', () => {
  const row = (path: string) =>
    screen.getAllByRole('row').find((element) => element.dataset.path === path) as HTMLElement;

  it('treats empty objects and arrays as end rows', async () => {
    const onToggleCollapsed = vi.fn();
    const user = userEvent.setup();
    render(
      <JsonTreeView
        nodes={buildJsonTree({ value: { obj: {}, arr: [], list: ['x'] } })}
        onToggleCollapsed={onToggleCollapsed}
      />
    );

    expect(row('obj')).not.toHaveAttribute('aria-expanded');
    expect(row('arr')).not.toHaveAttribute('aria-expanded');
    expect(row('list')).toHaveAttribute('aria-expanded', 'true');

    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Copy path for obj' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}{Enter}');
    expect(onToggleCollapsed).not.toHaveBeenCalled();
  });

  it('pages ten rows and keeps the cell on Ctrl+Home and Ctrl+End', async () => {
    const user = userEvent.setup();
    render(<JsonTreeView nodes={nodes} readOnly />);

    await user.tab();
    await user.keyboard('{PageDown}');
    expect(row('field10')).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(row('field0')).toHaveFocus();

    await user.keyboard('{ArrowDown}{ArrowRight}{Control>}{End}{/Control}');
    expect(
      screen.getByRole('button', { name: `Copy path for field${FIELD_COUNT - 1}` })
    ).toHaveFocus();
    await user.keyboard('{Control>}{Home}{/Control}');
    expect(screen.getByRole('button', { name: 'Copy path for field0' })).toHaveFocus();
  });

  it('moves instead of toggling when the host fixes expansion', async () => {
    const user = userEvent.setup();
    render(
      <JsonTreeView nodes={buildJsonTree({ value: { config: { region: 'us' } } })} readOnly />
    );

    await user.tab();
    await user.keyboard('{Enter}');
    expect(row('config')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Copy path for config' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowDown}{ArrowLeft}');
    expect(row('config')).toHaveFocus();
  });

  it('prefers aria-labelledby over aria-label', () => {
    render(
      <>
        <h2 id="payload-heading">Payload</h2>
        <JsonTreeView
          nodes={nodes}
          readOnly
          aria-label="Ignored"
          aria-labelledby="payload-heading"
        />
      </>
    );
    expect(screen.getByRole('treegrid', { name: 'Payload' })).not.toHaveAttribute('aria-label');
  });

  it('returns focus to a wrapped value after Ctrl+Enter applies it', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<JsonTreeView nodes={buildJsonTree({ value: { note: 'hello' } })} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: 'Wrap value of note' }));
    await user.click(screen.getByRole('button', { name: 'Edit value of note' }));
    await user.clear(screen.getByRole('textbox', { name: 'Edit value of note' }));
    await user.keyboard('hello there{Control>}{Enter}{/Control}');

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ path: 'note' }), 'hello there');
    expect(screen.getByRole('button', { name: 'Edit value of note' })).toHaveFocus();
  });
});

describe('JsonTreeView copy announcements', () => {
  it('announces copies politely and keeps the inline check out of the accessibility tree', async () => {
    const user = userEvent.setup();
    render(<JsonTreeView nodes={buildJsonTree({ value: { name: 'Ada' } })} readOnly />);

    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Copy path for name' }));
    await waitFor(() => expect(status).toHaveTextContent('Path copied'));
    expect(screen.queryByRole('img', { name: 'Path copied' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy value of name' }));
    await waitFor(() => expect(status).toHaveTextContent('Value copied'));
  });

  it('re-announces a repeated copy', async () => {
    const user = userEvent.setup();
    render(<JsonTreeView nodes={buildJsonTree({ value: { name: 'Ada' } })} readOnly />);
    const copyPath = screen.getByRole('button', { name: 'Copy path for name' });

    await user.click(copyPath);
    const first = await screen.findByText('Path copied');
    await user.click(copyPath);
    await waitFor(() => expect(screen.getByText('Path copied')).not.toBe(first));
  });
});
