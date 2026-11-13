import { useState } from 'react';
import type { BandColumnProps } from './BandColumn';
import type { ColumnEdit, ColumnPopoverProps } from './ColumnPopover';
import type { EditorOverlayProps } from './EditorOverlay';
import type { SentenceBand } from './sentenceTypes';
import type { EditorAnchor } from './useEditorPlacement';
import type { RuleWindow } from './useRuleWindow';

export interface ColumnEditingParams {
  column: ColumnEdit | undefined;
  bands: readonly SentenceBand[];
  container: RuleWindow['container'];
}

/** The open pill's column and the actions that settle its popover. */
export interface OpenColumnEditor
  extends Pick<ColumnPopoverProps, 'column' | 'onApply' | 'onCancel' | 'onMoreProperties'> {
  anchor: EditorAnchor;
  onDismiss: NonNullable<EditorOverlayProps['onPressOutside']>;
}

export interface ColumnEditing {
  /** The column whose popover is open, or null. */
  openId: string | null;
  /** Opens a pill's popover, or closes it from its own pill; undefined while pills are plain. */
  onToggle: BandColumnProps['onToggle'];
  editor: OpenColumnEditor | undefined;
}

const pillOf = (section: HTMLElement | null, columnId: string): HTMLElement | undefined =>
  [...(section?.querySelectorAll<HTMLElement>('[data-band-id] li[data-column-id]') ?? [])]
    .find((item) => item.dataset.columnId === columnId)
    ?.querySelector<HTMLElement>('button') ?? undefined;

/** Which band column's popover is open; Apply, Cancel and Escape return focus to its pill, a press outside leaves it where it lands. */
export const useColumnEditing = ({
  column,
  bands,
  container,
}: ColumnEditingParams): ColumnEditing => {
  const [openId, setOpenId] = useState<string | null>(null);
  const open =
    column && openId !== null
      ? bands.flatMap((band) => band.columns).find((candidate) => candidate.id === openId)
      : undefined;
  if (openId !== null && !open) setOpenId(null);

  const close = (columnId: string, refocus: boolean) => {
    if (refocus) pillOf(container(), columnId)?.focus();
    setOpenId(null);
  };
  const editorOf = (edit: ColumnEdit, shown: OpenColumnEditor['column']): OpenColumnEditor => {
    const { onMoreProperties } = edit;
    return {
      column: shown,
      anchor: (section) => pillOf(section, shown.id),
      onApply: (change) => {
        if (Object.keys(change).length > 0) edit.onCommit(shown.id, change);
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

  return {
    openId: open ? open.id : null,
    onToggle: column
      ? (columnId) => setOpenId((current) => (current === columnId ? null : columnId))
      : undefined,
    editor: column && open ? editorOf(column, open) : undefined,
  };
};
