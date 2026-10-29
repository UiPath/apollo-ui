import type React from 'react';
import { useCallback, useMemo, useRef } from 'react';
import {
  type ClipboardPayload,
  fromClipboardHtml,
  parseTsv,
  toClipboardHtml,
  toTsv,
} from './clipboardCodec';
import { copyRangeMatrix, planRangeClear, planRangePaste } from './gridClipboard';
import { isFromTextField } from './gridEvents';
import type { GridClipboardActions, GridClipboardProps } from './gridTypes';

/**
 * Grid-internal: {@link DecisionTable} owns this, driven by its `clipboard` prop — consumers
 * reach the operations through the imperative handle, never this hook.
 */
interface GridClipboard {
  containerProps: Pick<React.HTMLAttributes<HTMLElement>, 'onCopy' | 'onCut' | 'onPaste'>;
  /** Delete/Backspace clears the range. Returns whether the key was consumed. */
  handleKeyDown: (event: React.KeyboardEvent) => boolean;
  actions: GridClipboardActions;
}

export const useGridClipboard = (
  props: GridClipboardProps | undefined,
  extent: { rowCount: number; columnCount: number }
): GridClipboard => {
  // Through a ref: the props object is rebuilt on every keystroke, and a handler closing over a
  // stale one would paste against the shape the grid had an edit ago.
  const ref = useRef({ props, extent });
  ref.current = { props, extent };

  const source = () => {
    const { props: live, extent: size } = ref.current;
    return live ? { ...live, ...size } : null;
  };

  const payload = (): ClipboardPayload | null => {
    const live = source();
    return live?.range ? { matrix: copyRangeMatrix(live, live.range) } : null;
  };

  const writeFlavors = (clipboardData: DataTransfer, copied: ClipboardPayload) => {
    clipboardData.setData('text/plain', toTsv(copied.matrix));
    clipboardData.setData('text/html', toClipboardHtml(copied));
  };

  // Returns whether it wrote, so a caller can tell a real clear from a no-op.
  // biome-ignore lint/correctness/useExhaustiveDependencies: everything is read through `ref` at call time
  const clearSelection = useCallback((): boolean => {
    const live = source();
    if (!live?.range || live.readOnly || live.editing) {
      return false;
    }
    const writes = planRangeClear(live, live.range);
    if (writes.length === 0) {
      return false;
    }
    live.onWrite(writes, 0);
    return true;
  }, []);

  const applyMatrix = (matrix: string[][], grow: boolean) => {
    const live = source();
    // Re-checked here, not just in the event handlers: the menu path awaits `readText()` first,
    // and the user can start editing (or the document turn read-only) while it is pending.
    if (!live?.range || live.readOnly || live.editing || matrix.length === 0) {
      return;
    }
    const plan = planRangePaste(live, live.range, matrix, { grow });
    // Never append rows no write reaches — `appendRows` counts the block's rows, while the write
    // loop drops ragged holes and cells `canWriteAt` refused.
    const lastRow = plan.writes.reduce((max, write) => Math.max(max, write.row), -1);
    const appendRows = Math.max(0, Math.min(plan.appendRows, lastRow + 1 - live.rowCount));
    if (plan.writes.length > 0) {
      live.onWrite(plan.writes, appendRows);
    }
    if (plan.clampedRows > 0 || plan.clampedColumns > 0 || plan.skippedCells > 0) {
      live.onPasteOutcome?.(plan);
    }
  };

  const onCopy = (event: React.ClipboardEvent) => {
    const live = source();
    if (!live || live.editing || isFromTextField(event.target) || !event.clipboardData) {
      return;
    }
    const copied = payload();
    if (!copied) {
      return;
    }
    event.preventDefault();
    writeFlavors(event.clipboardData, copied);
  };

  const onCut = (event: React.ClipboardEvent) => {
    const live = source();
    if (
      !live ||
      live.readOnly ||
      live.editing ||
      isFromTextField(event.target) ||
      !event.clipboardData
    ) {
      return;
    }
    const copied = payload();
    if (!copied) {
      return;
    }
    // Not delegated to `onCopy`: a descendant editor's own preventDefault (CodeMirror's, across
    // the shadow boundary) also sets `defaultPrevented`, so clearing on it would wipe the
    // selection while the clipboard held the editor's text.
    event.preventDefault();
    writeFlavors(event.clipboardData, copied);
    clearSelection();
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const live = source();
    if (
      !live ||
      live.editing ||
      live.readOnly ||
      isFromTextField(event.target) ||
      !event.clipboardData
    ) {
      return;
    }
    event.preventDefault();
    // The marked html flavor carries the typed in-app payload; anything unmarked is plain TSV.
    const pasted = fromClipboardHtml(event.clipboardData.getData('text/html'));
    applyMatrix(pasted?.matrix ?? parseTsv(event.clipboardData.getData('text/plain')), false);
  };

  /** Both flavors when the async API allows, TSV alone otherwise. */
  const menuCopy = async (): Promise<boolean> => {
    const live = source();
    if (!live || live.editing) {
      return false;
    }
    const copied = payload();
    if (!copied) {
      return false;
    }
    const tsv = toTsv(copied.matrix);
    const clipboard = navigator.clipboard;
    const canWriteFlavors = !!clipboard?.write && typeof ClipboardItem !== 'undefined';
    if (!canWriteFlavors && !clipboard?.writeText) {
      console.warn(
        'Grid clipboard: this context exposes no Clipboard API, so a menu copy cannot run.'
      );
      live.onClipboardBlocked?.('copy');
      return false;
    }
    // Only the clipboard call is guarded: a throw from anything else is our bug, not a refusal,
    // and must not be reported to the user as a blocked clipboard.
    try {
      if (canWriteFlavors) {
        await clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([tsv], { type: 'text/plain' }),
            'text/html': new Blob([toClipboardHtml(copied)], { type: 'text/html' }),
          }),
        ]);
      } else {
        await clipboard.writeText(tsv);
      }
      return true;
    } catch (error) {
      console.warn('Grid clipboard: the browser refused a clipboard write.', error);
      live.onClipboardBlocked?.('copy');
      return false;
    }
  };

  const menuCut = async () => {
    // Read-only refuses outright: the clear would no-op, leaving a copy wearing the cut's name
    // (the onCut DOM path already refuses, so the menu must agree with the keyboard).
    if (source()?.readOnly) {
      return;
    }
    // The clipboard write awaits; a selection moved meanwhile must not be the one cleared —
    // that would delete cells that were never copied. The clear runs only on the cut's own range.
    const cutRange = source()?.range;
    if (!(await menuCopy())) {
      return;
    }
    const live = source();
    if (
      cutRange &&
      live?.range &&
      live.range.anchor.row === cutRange.anchor.row &&
      live.range.anchor.col === cutRange.anchor.col &&
      live.range.focus.row === cutRange.focus.row &&
      live.range.focus.col === cutRange.focus.col
    ) {
      clearSelection();
    }
  };

  /** A denied read is reported so the consumer can point at Ctrl+V, rather than failing mute. */
  const menuPaste = async (grow: boolean) => {
    const live = source();
    if (!live || live.readOnly || live.editing) {
      return;
    }
    // Only the read is guarded. Wrapping the apply too would report our own bugs as a blocked
    // clipboard and point the user at Ctrl+V, which takes the same failing path without a catch.
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch (error) {
      console.warn('Grid clipboard: the browser refused a clipboard read.', error);
      live.onClipboardBlocked?.('paste');
      return;
    }
    applyMatrix(parseTsv(text), grow);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: everything is read through `ref` at call time
  const actions = useMemo<GridClipboardActions>(() => {
    // Fired from a menu click, so nothing awaits them — a rejection would otherwise be an
    // unhandled promise with no trace of which operation failed.
    const run = (operation: () => Promise<unknown>, name: string) => () => {
      operation().catch((error) => console.warn(`Grid clipboard: ${name} failed.`, error));
    };
    return {
      copy: run(menuCopy, 'copy'),
      cut: run(menuCut, 'cut'),
      paste: ({ grow } = {}) => run(() => menuPaste(grow === true), 'paste')(),
      clear: clearSelection,
    };
  }, [clearSelection]);

  const handleKeyDown = (event: React.KeyboardEvent): boolean => {
    const live = source();
    if (!live || (event.key !== 'Delete' && event.key !== 'Backspace')) {
      return false;
    }
    // Works wherever focus sits inside the grid — a footer button, a resize handle — since those
    // keep focus after activating. A text field owns these keys itself.
    if (!live.range || live.readOnly || live.editing || isFromTextField(event.target)) {
      return false;
    }
    // Only claim the key when something was cleared, so the consumer's handler still sees a
    // Delete that landed on nothing writable.
    if (!clearSelection()) {
      return false;
    }
    event.preventDefault();
    return true;
  };

  return { containerProps: props ? { onCopy, onCut, onPaste } : {}, handleKeyDown, actions };
};
