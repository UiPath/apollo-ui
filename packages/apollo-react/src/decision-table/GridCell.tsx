import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { showTitleIfClipped } from './clippedTitle';
import { commitMoveFor } from './gridEvents';
import {
  BODY_CELL_CLASS,
  CELL_EDITOR_CLASS,
  CELL_MARK_CLASS,
  CELL_SURFACE_CLASS,
  IN_RANGE_CLASS,
  OMIT_BORDER_CLASS,
} from './gridStyles';
import type { CellCommitMove, CellEdge } from './gridTypes';
import { MarkGlyph } from './MarkGlyph';
import type { Mark } from './marks';

/**
 * What a custom cell editor receives: the value to seed from and the cell's commit contract.
 * A custom editor owns its own blur/commit dedup — the cell's key-then-blur double-commit guard
 * covers only the built-in input, so a plain editor that commits on both Enter and blur would
 * land two commits (and two undo entries) per edit.
 */
export interface GridCellEditorContext {
  value: string;
  /** Typing opened the editor, and the browser is about to deliver that keystroke into it. */
  openedByTyping?: boolean;
  ariaLabel: string;
  onCommit: (text: string, move: CellCommitMove) => void;
  onCancel: () => void;
  onDraftChange?: (text: string) => void;
}

export interface GridCellProps {
  value: string;
  /** What the resting cell shows when that differs from the value the editor edits. */
  restingValue?: string;
  placeholder?: string;
  mono?: boolean;
  readOnly?: boolean;
  /** Pins the cell over the viewport's left edge at this offset. */
  pinnedLeft?: number;
  /** Grid coordinates, exposed as data attributes for a grid's delegated context-menu handler. */
  row: number;
  col: number;
  selected: boolean;
  /** Inside the multi-cell selection (painted as a tint; the focus ring stays `selected`'s). */
  inRange?: boolean;
  editing: boolean;
  /** See {@link GridCellEditorContext.openedByTyping}. */
  openedByTyping?: boolean;
  /** Swaps the plain text input for a custom editor (e.g. a FEEL editor) while editing. */
  renderEditor?: (context: GridCellEditorContext) => React.ReactNode;
  /** Rendered inline after the resting value (e.g. a drift hint); hidden while editing. Must stay
   * inline — rows have a fixed height the virtualization arithmetic depends on. */
  suffix?: React.ReactNode;
  /** Makes the resting cell keyboard-focusable; Enter/F2 select the cell and start editing. */
  focusable?: boolean;
  /**
   * Roving tabindex: with many focusable cells in a virtualized grid, Tab must enter the grid at
   * ONE cell (and leave with the next Tab), not walk every mounted cell.
   */
  tabStop?: boolean;
  /** Extra classes on the `<td>` — the consumer's seam for per-cell state (status tints, etc.). */
  className?: string;
  /** What this cell paints and says on hover; the attributes carry it, so one tooltip serves the grid. */
  mark?: Mark;
  /** Marked elements sharing a group show one message, so hovering across them keeps one tooltip in place. */
  markGroup?: string;
  /** Omit borders around the cell */
  omitBorders?: readonly CellEdge[];
  /** The cell's testid; the default plain editor input derives `{dataTestId}-editor` from it. */
  dataTestId: string;
  ariaLabel: string;
  /** `extend` is the click's shift state — true grows the range instead of moving the selection. */
  onSelect: (extend: boolean) => void;
  onStartEdit: () => void;
  onCommit: (text: string, move: CellCommitMove) => void;
  onCancel: () => void;
  /** Reports the uncommitted text as it is typed, for a surface mirroring the edit. */
  onDraftChange?: (text: string) => void;
}

/** A cell shows its value, or the column's hint when empty, or nothing at all. */
export const renderRestingCellContent = (
  value: string,
  placeholder: string | undefined
): React.ReactNode => {
  if (value) {
    return value;
  }
  return placeholder ? <span className="text-foreground-de-emp italic">{placeholder}</span> : null;
};

/**
 * One grid cell with spreadsheet semantics: click selects, double-click/F2 edits,
 * Enter commits down, Tab commits right (Shift+Tab left), Escape cancels, blur commits in place.
 */
export const GridCell: React.FC<GridCellProps> = ({
  value,
  restingValue,
  placeholder,
  mono,
  readOnly,
  pinnedLeft,
  row,
  col,
  selected,
  inRange,
  editing,
  openedByTyping,
  renderEditor,
  suffix,
  focusable,
  tabStop = true,
  className,
  mark,
  markGroup,
  omitBorders,
  dataTestId,
  ariaLabel,
  onSelect,
  onStartEdit,
  onCommit,
  onCancel,
  onDraftChange,
}) => {
  // Set when a key commit/cancel already handled this edit session, so the
  // following native blur doesn't commit a second time.
  const settledByKeyRef = useRef(false);
  const isEditing = editing && !readOnly;
  // While editing the editor holds focus, so the cell itself leaves the tab order; while resting,
  // only the grid's single roving tab stop is reachable by Tab (the rest are focusable by script).
  const restingTabIndex = isEditing || !tabStop ? -1 : 0;

  // When a keyboard-settled edit ends, focus returns to the cell so the user keeps their place.
  // Blur-settled edits are excluded — focus already moved to wherever the user clicked.
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const wasEditingRef = useRef(isEditing);
  useLayoutEffect(() => {
    if (focusable && wasEditingRef.current && !isEditing && settledByKeyRef.current) {
      cellRef.current?.focus();
    }
    wasEditingRef.current = isEditing;
  });

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter/Escape during an IME composition confirm or dismiss the composition, not the edit —
    // committing here would save a half-composed draft (the navigation hook guards the same way).
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      settledByKeyRef.current = true;
      onCommit(event.currentTarget.value, commitMoveFor(event));
      return;
    }
    if (event.key === 'Escape') {
      settledByKeyRef.current = true;
      onCancel();
    }
  };

  return (
    <td
      ref={cellRef}
      className={cn(
        BODY_CELL_CLASS,
        omitBorders?.map((edge) => OMIT_BORDER_CLASS[edge]),
        mono && 'font-mono',
        'font-normal',
        selected && 'shadow-[inset_0_0_0_2px_var(--color-primary)]',
        // Re-enables text selection for whatever the editor renders, the grid surface having
        // turned it off for the range gesture.
        isEditing && 'select-text',
        inRange && IN_RANGE_CLASS,
        pinnedLeft !== undefined && 'sticky z-1 bg-background',
        className,
        CELL_MARK_CLASS
      )}
      style={pinnedLeft !== undefined ? { left: pinnedLeft } : undefined}
      data-menu-target="cell"
      data-row={row}
      data-col={col}
      data-testid={dataTestId}
      data-tone={mark?.tone}
      // An editing cell drops its hover: the editor lints the draft live, and the title describes the committed text.
      data-mark-title={isEditing ? undefined : mark?.title}
      data-mark-group={markGroup}
      data-mark-matched={isEditing ? undefined : mark?.matched}
      data-selected={selected ? 'true' : 'false'}
      data-in-range={inRange ? 'true' : 'false'}
      aria-label={ariaLabel}
      // While this cell is editing, a click *inside* its own input bubbles up here. Re-selecting
      // would flip `editing` back to false and unmount the uncontrolled editor — and since focus
      // never left it, its blur commit does not run, so the draft typed before the click was simply
      // discarded. Clicking to reposition the caret or select text has to be a no-op instead.
      onClick={(event) => {
        if (!isEditing) {
          onSelect(event.shiftKey);
        }
      }}
      onDoubleClick={() => {
        if (!readOnly) {
          onStartEdit();
        }
      }}
      // Focusable while resting so a keyboard user can select the cell (Enter) and enter edit mode
      // (Enter / F2), matching the double-click; the editor takes focus itself while editing.
      tabIndex={focusable ? restingTabIndex : undefined}
      onKeyDown={
        focusable
          ? (event) => {
              if (editing || (event.key !== 'Enter' && event.key !== 'F2')) {
                return;
              }
              event.preventDefault();
              onSelect(false);
              if (!readOnly) {
                onStartEdit();
              }
            }
          : undefined
      }
    >
      {!isEditing && (
        <div className={cn(CELL_SURFACE_CLASS, 'flex items-center')}>
          <span className="min-w-0 truncate" onMouseEnter={showTitleIfClipped}>
            {renderRestingCellContent(restingValue ?? value, placeholder)}
            {suffix}
          </span>
          {/* Trails the text as the header and gutter glyphs do, outside the truncation so clipping never hides it. */}
          {mark?.glyph && <MarkGlyph tone={mark.tone} className="ml-1" />}
        </div>
      )}
      {isEditing &&
        renderEditor?.({ value, openedByTyping, ariaLabel, onCommit, onCancel, onDraftChange })}
      {isEditing && !renderEditor && (
        <input
          className={CELL_EDITOR_CLASS}
          // The td's label does not name a nested input — the editor needs its own.
          aria-label={ariaLabel}
          data-testid={`${dataTestId}-editor`}
          // biome-ignore lint/a11y/noAutofocus: opening a spreadsheet cell is an explicit edit gesture and the caret belongs in that cell
          autoFocus
          defaultValue={value}
          onFocus={(event) => {
            settledByKeyRef.current = false;
            // Select the existing text so typing replaces it instead of appending (e.g. a
            // default "-" would otherwise end up prefixed onto the new value).
            event.currentTarget.select();
          }}
          onChange={(event) => onDraftChange?.(event.currentTarget.value)}
          onKeyDown={handleEditorKeyDown}
          onBlur={(event) => {
            if (!settledByKeyRef.current) {
              onCommit(event.currentTarget.value, 'none');
            }
          }}
        />
      )}
    </td>
  );
};
