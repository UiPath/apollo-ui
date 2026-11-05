import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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

    it('labels itself for a screen reader', () => {
      renderCell({ editing: true });
      expect(screen.getByTestId('cell-editor')).toHaveAttribute('aria-label', 'Amount, row 1');
    });
  });

  describe('a change mark', () => {
    it('paints the change from its data attribute', () => {
      renderCell({ mark: { change: 'update' } });
      expect(screen.getByTestId('cell').getAttribute('data-change')).toBe('update');
    });

    it('shows what the cell held, struck through, above what it holds', () => {
      renderCell({ mark: { change: 'update', previous: '30' } });
      const cell = screen.getByTestId('cell');
      expect(cell.querySelector('del')?.textContent).toBe('30');
      expect(cell.textContent).toBe('3042');
    });

    it('shows an empty previous value as the dash, not as nothing', () => {
      renderCell({ value: '', mark: { change: 'update', previous: '' } });
      expect(screen.getByTestId('cell').querySelector('del')?.textContent).toBe('—');
    });

    it('shows a note under the text, outside the old value', () => {
      renderCell({ mark: { badge: 'Moved up 3' } });
      const cell = screen.getByTestId('cell');
      expect(screen.getByText('Moved up 3')).toBeTruthy();
      expect(cell.querySelector('del')).toBeNull();
    });

    it('drops the old value and the note while editing', () => {
      renderCell({ editing: true, mark: { change: 'update', previous: '30', badge: 'note' } });
      const cell = screen.getByTestId('cell');
      expect(cell.querySelector('del')).toBeNull();
      expect(screen.queryByText('note')).toBeNull();
    });

    it('stays one line without a change', () => {
      renderCell();
      expect(screen.getByTestId('cell').hasAttribute('data-change')).toBe(false);
      expect(screen.getByTestId('cell').className).not.toContain('align-top');
    });
  });
});
