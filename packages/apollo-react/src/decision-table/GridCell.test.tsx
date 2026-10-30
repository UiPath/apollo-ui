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
});
