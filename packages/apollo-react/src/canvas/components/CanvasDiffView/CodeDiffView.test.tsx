import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { CodeDiffView } from './CodeDiffView';

// A small edit cap reaches the too-large fallback with a few rows; rendering enough rows to
// pass the real cap takes seconds on CI. lineDiff.test.ts covers the real cap.
vi.mock('./lineDiff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lineDiff')>();
  return {
    ...actual,
    diffLines: (before: string[], after: string[]) => actual.diffLines(before, after, 4),
  };
});

/** Each body row as "<left number> <left text> | <right number> <right text>". */
function rowsOf(before: string, after: string) {
  render(<CodeDiffView before={before} after={after} />);
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => {
      const cells = Array.from(row.querySelectorAll('td'), (cell) => cell.textContent ?? '');
      return `${cells[0]} ${cells[1]} | ${cells[2]} ${cells[3]}`.trim();
    });
}

describe('CodeDiffView', () => {
  it('aligns unchanged lines with no change markers', () => {
    expect(rowsOf('a\nb', 'a\nb')).toEqual(['1 a | 1 a', '2 b | 2 b']);
    expect(screen.queryByText('Added')).not.toBeInTheDocument();
    expect(screen.queryByText('Removed')).not.toBeInTheDocument();
  });

  it('marks an added line on the right only', () => {
    expect(rowsOf('a\nc', 'a\nb\nc')).toEqual(['1 a | 1 a', '| 2 Added b', '2 c | 3 c']);
  });

  it('marks a removed line on the left only', () => {
    expect(rowsOf('a\nb\nc', 'a\nc')).toEqual(['1 a | 1 a', '2 Removed b |', '3 c | 2 c']);
  });

  it('pairs a changed line as removed beside added', () => {
    expect(rowsOf('a\nold\nc', 'a\nnew\nc')).toEqual([
      '1 a | 1 a',
      '2 Removed old | 2 Added new',
      '3 c | 3 c',
    ]);
  });

  it('tints removed and added lines with the canvas diff colors', () => {
    render(<CodeDiffView before="old" after="new" />);

    const cell = (text: string) =>
      screen.getAllByRole('cell').find((td) => td.textContent === text);
    expect(cell('Removed old')).toHaveClass('bg-error-background');
    expect(cell('Added new')).toHaveClass('bg-success-background');
  });

  it('renders no rows for two empty texts', () => {
    expect(rowsOf('', '')).toEqual([]);
  });

  it('shows every line as added when the before text is empty', () => {
    expect(rowsOf('', 'a\nb')).toEqual(['| 1 Added a', '| 2 Added b']);
  });

  it('shows both sides unmarked when too many lines changed to diff', () => {
    expect(rowsOf('a\nb\nc', 'x\ny\nz')).toEqual(['1 a | 1 x', '2 b | 2 y', '3 c | 3 z']);
    expect(screen.getByRole('status')).toHaveTextContent('Too many changes to highlight');
    expect(screen.queryByText('Added')).not.toBeInTheDocument();
    expect(document.querySelector('.bg-success-background')).toBeNull();
  });
});
