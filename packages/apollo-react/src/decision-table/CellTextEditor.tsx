import type React from 'react';
import { useRef } from 'react';
import { commitMoveFor } from './gridEvents';
import { CELL_EDITOR_CLASS } from './gridStyles';
import type { GridCellEditorContext } from './gridTypes';

export interface CellTextEditorProps
  extends Pick<
    GridCellEditorContext,
    'value' | 'ariaLabel' | 'onCommit' | 'onCancel' | 'onDraftChange'
  > {
  /** The input's testid. */
  dataTestId: string;
  /** Whether a key settled the edit: false once the input takes focus, true on Enter, Tab or Escape. */
  onKeySettle?: (settled: boolean) => void;
}

/** The grid's plain cell editor: Enter commits down, Tab right, Shift+Tab left, Escape cancels, blur commits in place. */
export const CellTextEditor: React.FC<CellTextEditorProps> = ({
  value,
  ariaLabel,
  dataTestId,
  onCommit,
  onCancel,
  onDraftChange,
  onKeySettle,
}) => {
  // Set when a key commit/cancel already handled this edit session, so the
  // following native blur doesn't commit a second time.
  const settledByKeyRef = useRef(false);
  /** What the input held when a key settled the edit, so a blur can tell a stale draft from a new one. */
  const keySettledValueRef = useRef<string | null>(null);

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter/Escape during an IME composition confirm or dismiss the composition, not the edit —
    // committing here would save a half-composed draft (the navigation hook guards the same way).
    // Safari reports the confirming Enter with `isComposing` already false, so the legacy 229
    // keyCode every IME sets while composing is checked too.
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      settledByKeyRef.current = true;
      onKeySettle?.(true);
      keySettledValueRef.current = event.currentTarget.value;
      onCommit(event.currentTarget.value, commitMoveFor(event));
      return;
    }
    if (event.key === 'Escape') {
      settledByKeyRef.current = true;
      onKeySettle?.(true);
      keySettledValueRef.current = event.currentTarget.value;
      onCancel();
    }
  };

  return (
    <input
      className={CELL_EDITOR_CLASS}
      // The td's label does not name a nested input — the editor needs its own.
      aria-label={ariaLabel}
      data-testid={dataTestId}
      // biome-ignore lint/a11y/noAutofocus: opening a spreadsheet cell is an explicit edit gesture and the caret belongs in that cell
      autoFocus
      defaultValue={value}
      onFocus={(event) => {
        settledByKeyRef.current = false;
        onKeySettle?.(false);
        keySettledValueRef.current = null;
        // Select the existing text so typing replaces it instead of appending (e.g. a
        // default "-" would otherwise end up prefixed onto the new value).
        event.currentTarget.select();
      }}
      onChange={(event) => onDraftChange?.(event.currentTarget.value)}
      onKeyDown={handleEditorKeyDown}
      onBlur={(event) => {
        // A key-settled commit already carried this text, so blurring must not send it twice.
        // A consumer that refuses the commit keeps the editor open, though, and anything typed
        // after that is a draft this blur is the last chance to keep.
        if (!settledByKeyRef.current || event.currentTarget.value !== keySettledValueRef.current) {
          onCommit(event.currentTarget.value, 'none');
        }
      }}
    />
  );
};
