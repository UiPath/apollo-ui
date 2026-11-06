import { useSafeLingui } from '../i18n/useSafeLingui';

/** The table's own titles for its drag and insert affordances, in the active locale. */
export const useGridStrings = () => {
  const { _ } = useSafeLingui();
  return {
    dragRow: _({ id: 'decision-table.drag_row', message: 'Drag to reorder whole row' }),
    dragColumn: _({ id: 'decision-table.drag_column', message: 'Drag to reorder whole column' }),
    insertRowAbove: _({ id: 'decision-table.insert_row_above', message: 'Insert row above' }),
    insertColumnLeft: _({ id: 'decision-table.insert_column_left', message: 'Insert column left' }),
  };
};
