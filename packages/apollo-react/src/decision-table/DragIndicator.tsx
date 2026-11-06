import { COLUMN_DRAG_INDICATOR_CLASS, ROW_DRAG_INDICATOR_CLASS } from './gridStyles';
import { useGridStrings } from './useGridStrings';

export interface DragIndicatorProps {
  /**
   * A header's top line, revealed by its `group/header`; or a row number's left, revealed by its
   * `group/gutter`.
   */
  axis: 'row' | 'column';
  testId?: string;
}

/** The pill that says the whole row or column drags; the press is taken by its header or row number. */
export const DragIndicator = ({ axis, testId }: DragIndicatorProps) => {
  const strings = useGridStrings();
  return (
    <span
      aria-hidden
      className={axis === 'row' ? ROW_DRAG_INDICATOR_CLASS : COLUMN_DRAG_INDICATOR_CLASS}
      title={axis === 'row' ? strings.dragRow : strings.dragColumn}
      data-testid={testId}
    />
  );
};
