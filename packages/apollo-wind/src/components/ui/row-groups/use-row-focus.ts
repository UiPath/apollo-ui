import * as React from 'react';

/** A focus move, waiting for the list to reach `rows` items. */
type Pending = { kind: 'add'; rows: number } | { kind: 'delete'; position: number; rows: number };

const ROWS = ':scope > [data-row]';

function rowCount(list: HTMLElement | null) {
  return list?.querySelectorAll(ROWS).length ?? 0;
}

/**
 * Moves focus after a repeatable list changes, so keyboard users keep their place.
 *
 * Items are the `[data-row]` direct children of `listRef`. After an add, focus lands on the new
 * last item's `[data-row-first]` control, or its first button or input. After a delete, it lands
 * on the `[data-row-delete]` action of the item now at the same position, or on `addRef` once the
 * list is empty. Call `afterAdd` / `afterDelete` alongside the change. Focus moves on the next
 * render only if the list grew or shrank by one, so a change the host rejects or defers leaves
 * focus where it is.
 */
export function useRowFocus() {
  const listRef = React.useRef<HTMLDivElement>(null);
  const addRef = React.useRef<HTMLButtonElement>(null);
  const pending = React.useRef<Pending | null>(null);

  // No deps: the change being waited for can arrive on any render.
  React.useEffect(() => {
    const next = pending.current;
    const list = listRef.current;
    if (!next || !list) return;
    pending.current = null;
    const rows = Array.from(list.querySelectorAll<HTMLElement>(ROWS));
    if (rows.length !== next.rows) return;
    if (next.kind === 'add') {
      const row = rows[rows.length - 1];
      (
        row?.querySelector<HTMLElement>('[data-row-first]') ??
        row?.querySelector<HTMLElement>('button, input, textarea')
      )?.focus();
      return;
    }
    const target = rows[Math.min(next.position, rows.length - 1)];
    (target?.querySelector<HTMLElement>('[data-row-delete]') ?? addRef.current)?.focus();
  });

  const afterAdd = React.useCallback(() => {
    pending.current = { kind: 'add', rows: rowCount(listRef.current) + 1 };
  }, []);
  /** `position` is the removed item's 0-based index. */
  const afterDelete = React.useCallback((position: number) => {
    pending.current = {
      kind: 'delete',
      position,
      rows: Math.max(rowCount(listRef.current) - 1, 0),
    };
  }, []);

  return React.useMemo(() => ({ listRef, addRef, afterAdd, afterDelete }), [afterAdd, afterDelete]);
}
