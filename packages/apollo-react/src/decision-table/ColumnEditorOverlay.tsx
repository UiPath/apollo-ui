import type React from 'react';
import { ColumnPopover, type ColumnPopoverLabels, columnTitle } from './ColumnPopover';
import type { ColumnTypeChoice } from './columnTypes';
import { EditorOverlay } from './EditorOverlay';
import { COLUMN_EDITOR_CLASS } from './sentenceStyles';
import type { OpenColumnEditor } from './useColumnEditing';
import type { RuleWindow } from './useRuleWindow';

export interface ColumnEditorOverlayProps {
  editor: OpenColumnEditor;
  types: readonly ColumnTypeChoice[];
  labels: ColumnPopoverLabels;
  container: RuleWindow['container'];
  id: string;
  dataTestId: string;
}

/** The open pill's popover, under its pill. */
export const ColumnEditorOverlay: React.FC<ColumnEditorOverlayProps> = ({
  editor,
  types,
  labels,
  container,
  id,
  dataTestId,
}) => {
  const { field } = editor;
  return (
    <EditorOverlay
      anchor={editor.anchor}
      container={container}
      ariaLabel={columnTitle(field.kind, editor.column.name, labels)}
      className={COLUMN_EDITOR_CLASS}
      id={id}
      dataTestId={`${dataTestId}-column-editor`}
      onPressOutside={editor.onDismiss}
      onCancel={editor.onCancel}
    >
      <ColumnPopover
        column={editor.column}
        field={field}
        types={types}
        onApply={editor.onApply}
        onCancel={editor.onCancel}
        onMoreProperties={editor.onMoreProperties}
        labels={labels}
        dataTestId={`${dataTestId}-column`}
      />
    </EditorOverlay>
  );
};
