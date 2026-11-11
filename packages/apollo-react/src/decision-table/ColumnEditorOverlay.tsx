import type React from 'react';
import {
  type ColumnEdit,
  ColumnPopover,
  type ColumnPopoverLabels,
  columnTitle,
} from './ColumnPopover';
import { EditorOverlay } from './EditorOverlay';
import { COLUMN_EDITOR_CLASS } from './sentenceStyles';
import type { OpenColumnEditor } from './useColumnEditing';

export interface ColumnEditorOverlayProps {
  editor: OpenColumnEditor;
  edit: ColumnEdit;
  labels: ColumnPopoverLabels;
  container: () => HTMLElement | null;
  id: string;
  dataTestId: string;
}

/** The open pill's popover, under its pill. */
export const ColumnEditorOverlay: React.FC<ColumnEditorOverlayProps> = ({
  editor,
  edit,
  labels,
  container,
  id,
  dataTestId,
}) => {
  const field = edit.field(editor.column.id);
  return (
    <EditorOverlay
      anchor={editor.anchor}
      container={container}
      ariaLabel={columnTitle(field.kind, editor.column.name, labels)}
      className={COLUMN_EDITOR_CLASS}
      id={id}
      dataTestId={`${dataTestId}-column-editor`}
      onPressOutside={editor.onDismiss}
    >
      <ColumnPopover
        column={editor.column}
        field={field}
        types={edit.types}
        onApply={editor.onApply}
        onCancel={editor.onCancel}
        onMoreProperties={editor.onMoreProperties}
        labels={labels}
        dataTestId={`${dataTestId}-column`}
      />
    </EditorOverlay>
  );
};
