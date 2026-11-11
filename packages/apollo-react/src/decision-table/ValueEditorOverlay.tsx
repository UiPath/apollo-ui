import type React from 'react';
import { CellTextEditor } from './CellTextEditor';
import { BODY_ROW_HEIGHT_PX } from './constants';
import type { GridCellEditorContext } from './GridCell';
import { VALUE_EDITOR_CLASS } from './sentenceStyles';
import type { SentenceValueId } from './sentenceTypes';
import { type EditorPlacement, useEditorPlacement } from './useEditorPlacement';

/** The overlay's inline style: its placement, and the row height a grid cell editor sizes itself from. */
type ValueEditorStyle = React.CSSProperties & Record<'--grid-row-height', string>;

const UNPLACED: EditorPlacement = { top: 0, left: 0 };

const overlayStyle = ({ top, left }: EditorPlacement): ValueEditorStyle => ({
  top,
  left,
  '--grid-row-height': `${BODY_ROW_HEIGHT_PX}px`,
});

const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();

/** What a host's value editor receives: the grid's editor contract, and the value it edits. */
export interface SentenceEditorContext extends GridCellEditorContext {
  target: SentenceValueId;
}

export interface ValueEditorOverlayProps {
  editor: SentenceEditorContext;
  renderEditor: ((context: SentenceEditorContext) => React.ReactNode) | undefined;
  container: () => HTMLElement | null;
  dataTestId: string;
}

/** The open value's editor, over the rules at its value: the host's editor, else the grid's plain one. */
export const ValueEditorOverlay: React.FC<ValueEditorOverlayProps> = ({
  editor,
  renderEditor,
  container,
  dataTestId,
}) => {
  const { overlayRef, placement } = useEditorPlacement({ container, target: editor.target });
  return (
    <fieldset
      ref={overlayRef}
      aria-label={editor.ariaLabel}
      className={VALUE_EDITOR_CLASS}
      style={overlayStyle(placement ?? UNPLACED)}
      data-testid={`${dataTestId}-value-editor`}
      onKeyDown={stopPropagation}
      onClick={stopPropagation}
    >
      {placement &&
        (renderEditor ? (
          renderEditor(editor)
        ) : (
          <CellTextEditor
            value={editor.value}
            ariaLabel={editor.ariaLabel}
            dataTestId={`${dataTestId}-editor`}
            onCommit={editor.onCommit}
            onCancel={editor.onCancel}
          />
        ))}
    </fieldset>
  );
};
