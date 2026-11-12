import { Button, cn } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import {
  INSERT_COLUMN_CLASS,
  INSERT_COLUMN_LINE_CLASS,
  INSERT_COLUMN_ZONE_CLASS,
  INSERT_ROW_CLASS,
  INSERT_ROW_LINE_CLASS,
  INSERT_ROW_ZONE_CLASS,
} from './gridStyles';
import { useGridStrings } from './useGridStrings';

const AXIS_CLASSES = {
  row: { zone: INSERT_ROW_ZONE_CLASS, line: INSERT_ROW_LINE_CLASS, button: INSERT_ROW_CLASS },
  column: {
    zone: INSERT_COLUMN_ZONE_CLASS,
    line: INSERT_COLUMN_LINE_CLASS,
    button: INSERT_COLUMN_CLASS,
  },
};

export interface EdgeInsertButtonProps {
  /**
   * A row's top edge, revealed by its row-number cell's `group/gutter`; or a column header's left
   * edge, revealed by the header's `group/header`.
   */
  axis: 'row' | 'column';
  testId: string;
  zoneTestId?: string;
  onInsert: () => void;
  /** Where this one sits or when it shows, beyond its axis's own rules. */
  zoneClassName?: string;
  buttonClassName?: string;
  onHoverChange?: (hovered: boolean) => void;
}

/**
 * The hover "+" for inserting a row or column where it goes: a zone, its line, and the button. It
 * is out of the tab order, so a consumer offers keyboard users the same insert as a menu item.
 */
export const EdgeInsertButton = ({
  axis,
  testId,
  zoneTestId,
  onInsert,
  zoneClassName,
  buttonClassName,
  onHoverChange,
}: EdgeInsertButtonProps) => {
  const strings = useGridStrings();
  const label = axis === 'row' ? strings.insertRowAbove : strings.insertColumnLeft;
  return (
    <span className={cn(AXIS_CLASSES[axis].zone, zoneClassName)} data-testid={zoneTestId}>
      <span aria-hidden className={AXIS_CLASSES[axis].line} />
      <Button
        variant="ghost"
        size="4xs"
        icon
        className={cn(AXIS_CLASSES[axis].button, buttonClassName)}
        aria-label={label}
        title={label}
        // One per row and header: in the tab order they would be dozens of identical stops.
        tabIndex={-1}
        data-testid={testId}
        onPointerEnter={onHoverChange && (() => onHoverChange(true))}
        onPointerLeave={onHoverChange && (() => onHoverChange(false))}
        // Neither a selection nor the start of a drag: the "+" sits inside a pressable header or row number.
        onPointerDown={(event) => event.stopPropagation()}
        // The focused "+" keeps its keys: the table's navigation would otherwise take Enter and Space
        // (opening a cell's editor instead of the click) and Tab (moving the selection, not focus).
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          // Not also a selection: the "+" sits inside a clickable header or gutter.
          event.stopPropagation();
          onInsert();
        }}
      >
        <Plus aria-hidden />
      </Button>
    </span>
  );
};
