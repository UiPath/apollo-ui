import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { onTestFinished, vi } from 'vitest';
import { GridCell, type GridCellProps } from './GridCell';

const renderCell = (props: Partial<GridCellProps> = {}) => {
  const handlers = {
    onSelect: vi.fn(),
    onStartEdit: vi.fn(),
    onCommit: vi.fn(),
    onCancel: vi.fn(),
  };
  render(
    <table>
      <tbody>
        <tr>
          <GridCell
            value="42"
            row={0}
            col={0}
            selected
            editing={false}
            focusable
            dataTestId="cell"
            ariaLabel="Amount, row 1"
            {...handlers}
            {...props}
          />
        </tr>
      </tbody>
    </table>
  );
  return handlers;
};

const EditingCell = () => {
  const [editing, setEditing] = useState(true);
  const settle = () => setEditing(false);
  return (
    <table>
      <tbody>
        <tr>
          <GridCell
            value="42"
            row={0}
            col={0}
            selected
            editing={editing}
            focusable
            dataTestId="cell"
            ariaLabel="Amount, row 1"
            onSelect={vi.fn()}
            onStartEdit={vi.fn()}
            onCommit={settle}
            onCancel={settle}
          />
        </tr>
      </tbody>
    </table>
  );
};

describe('GridCell', () => {
  it('marks itself while its editor is open, for the row hover to skip its row', () => {
    renderCell({ editing: true });
    expect(screen.getByTestId('cell').getAttribute('data-editing')).toBe('true');
  });

  it('carries no editing marker at rest', () => {
    renderCell();
    expect(screen.getByTestId('cell').hasAttribute('data-editing')).toBe(false);
  });

  describe('Enter on a resting cell', () => {
    it('opens the editor when this cell is the selected one', () => {
      const { onStartEdit } = renderCell();
      fireEvent.keyDown(screen.getByTestId('cell'), { key: 'Enter' });
      expect(onStartEdit).toHaveBeenCalled();
    });

    /**
     * Arrows move the selection without moving DOM focus, so the cell the user clicked keeps the
     * focus after arrowing away. Answering Enter there would drag the selection back and open the
     * wrong cell; left alone, the event reaches the grid's navigation, which opens the selected one.
     */
    it('stands aside when the selection has moved to another cell', () => {
      const { onStartEdit, onSelect } = renderCell({ selected: false });
      const event = fireEvent.keyDown(screen.getByTestId('cell'), { key: 'Enter' });
      expect(onStartEdit).not.toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
      // Not claimed either, so the grid container still sees it.
      expect(event).toBe(true);
    });
  });

  describe('the built-in editor', () => {
    it('commits a draft on blur after a commit the consumer refused', () => {
      // `editing` stays true: the consumer rejected the Enter commit and kept the editor open.
      const { onCommit } = renderCell({ editing: true });
      const editor = screen.getByTestId('cell-editor');

      fireEvent.keyDown(editor, { key: 'Enter' });
      expect(onCommit).toHaveBeenCalledTimes(1);

      fireEvent.change(editor, { target: { value: '43' } });
      fireEvent.blur(editor);
      // Without the reset, the spent Enter would mark this blur as already settled and the
      // edited draft would be dropped.
      expect(onCommit).toHaveBeenCalledTimes(2);
      expect(onCommit).toHaveBeenLastCalledWith('43', 'none');
    });

    it('ignores Enter while an IME composition is being confirmed', () => {
      const { onCommit } = renderCell({ editing: true });
      const editor = screen.getByTestId('cell-editor');

      // Safari reports the confirming Enter with isComposing already false and keyCode 229.
      fireEvent.keyDown(editor, { key: 'Enter', keyCode: 229 });
      expect(onCommit).not.toHaveBeenCalled();

      fireEvent.keyDown(editor, { key: 'Enter' });
      expect(onCommit).toHaveBeenCalledTimes(1);
    });

    it.each([
      'Enter',
      'Tab',
      'Escape',
    ])('returns focus to the cell once %s settles the edit', (key) => {
      render(<EditingCell />);
      fireEvent.keyDown(screen.getByTestId('cell-editor'), { key });
      expect(screen.queryByTestId('cell-editor')).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId('cell'));
    });

    it('leaves focus where it went once a blur settles the edit', () => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      render(<EditingCell />);
      act(() => outside.focus());
      expect(screen.queryByTestId('cell-editor')).toBeNull();
      expect(document.activeElement).toBe(outside);
    });

    it.each([
      ['while the editor stays open', false],
      ['once focus leaves before the host closes the editor a moment later', true],
    ])('commits nothing on a blur after Escape cancels the draft, %s', async (_, late) => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const onCommit = vi.fn();
      const SlowCancelCell = () => {
        const [editing, setEditing] = useState(true);
        return (
          <table>
            <tbody>
              <tr>
                <GridCell
                  value="42"
                  row={0}
                  col={0}
                  selected
                  editing={editing}
                  focusable
                  dataTestId="cell"
                  ariaLabel="Amount, row 1"
                  onSelect={vi.fn()}
                  onStartEdit={vi.fn()}
                  onCommit={onCommit}
                  onCancel={() => {
                    if (late) void Promise.resolve().then(() => setEditing(false));
                  }}
                />
              </tr>
            </tbody>
          </table>
        );
      };
      render(<SlowCancelCell />);
      const editor = screen.getByTestId('cell-editor');
      fireEvent.change(editor, { target: { value: 'cancelled' } });
      fireEvent.keyDown(editor, { key: 'Escape' });
      act(() => outside.focus());
      await act(async () => {});
      expect(onCommit).not.toHaveBeenCalled();
    });

    it('labels itself for a screen reader', () => {
      renderCell({ editing: true });
      expect(screen.getByTestId('cell-editor')).toHaveAttribute('aria-label', 'Amount, row 1');
    });
  });
});
