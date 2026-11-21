import { useLayoutEffect, useRef, useState } from 'react';
import type { BandMode } from './BandList';
import type { ColumnEdit, ColumnPopoverProps } from './ColumnPopover';
import type { EditorOverlayProps } from './EditorOverlay';
import type { SentenceBand } from './sentenceTypes';
import type { EditorAnchor } from './useEditorPlacement';
import type { RuleWindow } from './useRuleWindow';

export interface ColumnEditingParams<Type> {
  column: ColumnEdit<Type> | undefined;
  bands: readonly SentenceBand[];
  container: RuleWindow['container'];
}

/** The open pill's column and the actions that settle its popover. */
export interface OpenColumnEditor<Type>
  extends Pick<
    ColumnPopoverProps<Type>,
    'column' | 'field' | 'onApply' | 'onCancel' | 'onMoreProperties'
  > {
  anchor: EditorAnchor;
  onDismiss: NonNullable<EditorOverlayProps['onPressOutside']>;
}

/** Plain pills, or the pills' toggle, which opens a popover or closes it from its own pill, the column whose popover is open, or null, and its editor. */
export type ColumnEditing<Type> =
  | { kind: 'plain' }
  | {
      kind: 'edit';
      pills: Pick<Extract<BandMode, { kind: 'edit' }>, 'onToggle' | 'openColumnId'>;
      editor: OpenColumnEditor<Type> | undefined;
    };

const pillOf = (section: HTMLElement | null, columnId: string): HTMLElement | undefined =>
  [...(section?.querySelectorAll<HTMLElement>('[data-band-id] li[data-column-id]') ?? [])]
    .find((item) => item.dataset.columnId === columnId)
    ?.querySelector<HTMLElement>('button') ?? undefined;

/** Which band column's popover is open; Apply, Cancel and Escape return focus to its pill, a press outside leaves it where it lands. */
export const useColumnEditing = <Type>({
  column,
  bands,
  container,
}: ColumnEditingParams<Type>): ColumnEditing<Type> => {
  const [openId, setOpenId] = useState<string | null>(null);
  const refocusRef = useRef<string | null>(null);
  const open =
    column && openId !== null
      ? bands.flatMap((band) => band.columns).find((candidate) => candidate.id === openId)
      : undefined;
  const field = column && open ? column.field(open.id) : undefined;
  if (openId !== null && !field) setOpenId(null);

  useLayoutEffect(() => {
    const columnId = refocusRef.current;
    if (openId !== null || columnId === null) return;
    refocusRef.current = null;
    const section = container();
    const bandId = bands.find((band) => band.columns.some((item) => item.id === columnId))?.id;
    const more = section?.querySelector<HTMLElement>(`[data-band-id="${bandId}"] [data-band-more]`);
    (pillOf(section, columnId) ?? more)?.focus();
  }, [openId, container, bands]);

  const close = (columnId: string, refocus: boolean) => {
    refocusRef.current = refocus ? columnId : null;
    setOpenId(null);
  };
  const editorOf = (
    edit: ColumnEdit<Type>,
    shown: OpenColumnEditor<Type>['column'],
    shownField: OpenColumnEditor<Type>['field']
  ): OpenColumnEditor<Type> => {
    const { onMoreProperties } = edit;
    return {
      column: shown,
      field: shownField,
      anchor: (section) => pillOf(section, shown.id),
      onApply: (change) => {
        if (Object.keys(change).some((key) => key !== 'kind')) edit.onCommit(shown.id, change);
        close(shown.id, true);
      },
      onCancel: () => close(shown.id, true),
      onDismiss: () => close(shown.id, false),
      onMoreProperties:
        onMoreProperties &&
        (() => {
          close(shown.id, false);
          onMoreProperties(shown.id);
        }),
    };
  };

  if (!column) return { kind: 'plain' };
  return {
    kind: 'edit',
    pills: {
      onToggle: (columnId) => setOpenId((current) => (current === columnId ? null : columnId)),
      openColumnId: open && field ? open.id : null,
    },
    editor: open && field ? editorOf(column, open, field) : undefined,
  };
};
