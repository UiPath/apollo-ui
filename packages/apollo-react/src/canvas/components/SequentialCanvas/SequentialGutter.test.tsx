import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SequentialGutterRow } from './SequentialGutter';
import { SequentialGutter } from './SequentialGutter';

function makeRow(overrides: Partial<SequentialGutterRow> = {}): SequentialGutterRow {
  return {
    nodeId: 'step-1',
    stepNumber: 1,
    collapsible: false,
    collapsed: false,
    ...overrides,
  };
}

describe('SequentialGutter', () => {
  it('renders nothing when there are no rows', () => {
    const { container } = render(
      <SequentialGutter
        rows={[]}
        positions={new Map()}
        collapsedStepIds={new Set()}
        onToggleCollapse={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the step number for every visible numbered row, right-aligned to its bar position', () => {
    const rows = [makeRow({ nodeId: 'a', stepNumber: 1 }), makeRow({ nodeId: 'b', stepNumber: 2 })];
    const positions = new Map([
      ['a', { x: 0, y: 0 }],
      ['b', { x: 0, y: 120 }],
    ]);
    render(
      <SequentialGutter
        rows={rows}
        positions={positions}
        collapsedStepIds={new Set()}
        onToggleCollapse={vi.fn()}
      />
    );

    const numbers = screen.getAllByTestId('sequential-gutter-number');
    expect(numbers.map((el) => el.textContent)).toEqual(['1', '2']);
  });

  it('skips a row with no known position instead of throwing', () => {
    const rows = [makeRow({ nodeId: 'a', stepNumber: 1 })];
    render(
      <SequentialGutter
        rows={rows}
        positions={new Map()}
        collapsedStepIds={new Set()}
        onToggleCollapse={vi.fn()}
      />
    );
    expect(screen.queryByTestId('sequential-gutter-number')).not.toBeInTheDocument();
  });

  it('renders a chevron only for collapsible rows', () => {
    const rows = [
      makeRow({ nodeId: 'a', stepNumber: 1, collapsible: false }),
      makeRow({ nodeId: 'b', stepNumber: 2, collapsible: true }),
    ];
    const positions = new Map([
      ['a', { x: 0, y: 0 }],
      ['b', { x: 0, y: 120 }],
    ]);
    render(
      <SequentialGutter
        rows={rows}
        positions={positions}
        collapsedStepIds={new Set()}
        onToggleCollapse={vi.fn()}
      />
    );

    // Only one row is collapsible, so exactly one disclosure button renders.
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('sets aria-expanded=true and an expand-vs-collapse label from collapsed state', () => {
    const rows = [makeRow({ nodeId: 'a', stepNumber: 3, collapsible: true, collapsed: false })];
    const positions = new Map([['a', { x: 64, y: 0 }]]);
    render(
      <SequentialGutter
        rows={rows}
        positions={positions}
        collapsedStepIds={new Set()}
        onToggleCollapse={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: 'Collapse step 3' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('reflects a collapsed row as aria-expanded=false with an expand label', () => {
    const rows = [makeRow({ nodeId: 'a', stepNumber: 3, collapsible: true, collapsed: true })];
    const positions = new Map([['a', { x: 64, y: 0 }]]);
    render(
      <SequentialGutter
        rows={rows}
        positions={positions}
        collapsedStepIds={new Set(['a'])}
        onToggleCollapse={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: 'Expand step 3' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles collapse on click, flipping the current collapsed state', () => {
    const onToggleCollapse = vi.fn();
    const rows = [makeRow({ nodeId: 'a', stepNumber: 1, collapsible: true, collapsed: false })];
    const positions = new Map([['a', { x: 64, y: 0 }]]);
    render(
      <SequentialGutter
        rows={rows}
        positions={positions}
        collapsedStepIds={new Set()}
        onToggleCollapse={onToggleCollapse}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Collapse step 1' }));
    expect(onToggleCollapse).toHaveBeenCalledWith('a', true);
  });

  it('marks the number span aria-hidden since the row aria-label lives on the bar itself', () => {
    const rows = [makeRow({ nodeId: 'a', stepNumber: 1 })];
    const positions = new Map([['a', { x: 0, y: 0 }]]);
    render(
      <SequentialGutter
        rows={rows}
        positions={positions}
        collapsedStepIds={new Set()}
        onToggleCollapse={vi.fn()}
      />
    );
    expect(screen.getByTestId('sequential-gutter-number')).toHaveAttribute('aria-hidden', 'true');
  });

  // The tree-rail rework. All numbers must sit in ONE fixed
  // column regardless of a row's own indent depth, with a dotted leader line
  // bridging out to each row's own (depth-varying) bar position.
  describe('tree-rail geometry', () => {
    it("positions every row column at the SAME fixed x, regardless of the row's own depth", () => {
      const rows = [
        makeRow({ nodeId: 'a', stepNumber: 1 }),
        makeRow({ nodeId: 'b', stepNumber: 2 }),
      ];
      const positions = new Map([
        ['a', { x: 0, y: 0 }], // depth 0
        ['b', { x: 128, y: 120 }], // depth 2 (2 * SEQ_INDENT_PX)
      ]);
      render(
        <SequentialGutter
          rows={rows}
          positions={positions}
          collapsedStepIds={new Set()}
          onToggleCollapse={vi.fn()}
        />
      );

      const columns = screen.getAllByTestId('sequential-gutter-row');
      const lefts = columns.map((el) => el.style.left);
      expect(lefts[0]).toBe(lefts[1]);
    });

    it('keeps the chevron immediately next to its number inside that same fixed column', () => {
      const rows = [makeRow({ nodeId: 'a', stepNumber: 3, collapsible: true })];
      const positions = new Map([['a', { x: 128, y: 0 }]]);
      render(
        <SequentialGutter
          rows={rows}
          positions={positions}
          collapsedStepIds={new Set()}
          onToggleCollapse={vi.fn()}
        />
      );

      const column = screen.getByTestId('sequential-gutter-row');
      expect(column).toContainElement(screen.getByRole('button'));
      expect(column).toContainElement(screen.getByTestId('sequential-gutter-number'));
    });

    it("renders one dotted leader line per row, from the fixed column out to that row's own bar position", () => {
      const rows = [
        makeRow({ nodeId: 'a', stepNumber: 1 }),
        makeRow({ nodeId: 'b', stepNumber: 2 }),
      ];
      const positions = new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 128, y: 120 }],
      ]);
      render(
        <SequentialGutter
          rows={rows}
          positions={positions}
          collapsedStepIds={new Set()}
          onToggleCollapse={vi.fn()}
        />
      );

      const leaders = screen.getAllByTestId('sequential-gutter-leader');
      expect(leaders).toHaveLength(2);
      expect(leaders[0].className).toContain('border-dotted');
      expect(leaders[0]).toHaveAttribute('aria-hidden', 'true');

      // The deeper row's leader must span further right (it bridges a wider gap
      // from the shared column to its own more-indented bar).
      const widthA = Number.parseFloat(leaders[0].style.width);
      const widthB = Number.parseFloat(leaders[1].style.width);
      expect(widthB).toBeGreaterThan(widthA);
    });

    it('vertically centers the leader line on its row', () => {
      const rows = [makeRow({ nodeId: 'a', stepNumber: 1 })];
      const positions = new Map([['a', { x: 64, y: 100 }]]);
      render(
        <SequentialGutter
          rows={rows}
          positions={positions}
          collapsedStepIds={new Set()}
          onToggleCollapse={vi.fn()}
        />
      );

      const leader = screen.getByTestId('sequential-gutter-leader');
      // top = row.y + SEQ_BAR_HEIGHT / 2 = 100 + 28.
      expect(Number.parseFloat(leader.style.top)).toBe(128);
    });

    it('uses a custom bar height for the number row and leader center', () => {
      const rows = [makeRow({ nodeId: 'a', stepNumber: 1 })];
      const positions = new Map([['a', { x: 64, y: 100 }]]);
      render(
        <SequentialGutter
          rows={rows}
          positions={positions}
          barHeight={48}
          collapsedStepIds={new Set()}
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.getByTestId('sequential-gutter-row').style.height).toBe('48px');
      expect(screen.getByTestId('sequential-gutter-leader').style.top).toBe('124px');
    });
  });
});
