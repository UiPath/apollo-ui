import type React from 'react';
import { useRef } from 'react';
import { EditorOverlay } from './EditorOverlay';
import { VALUE_EDITOR_CLASS } from './sentenceStyles';
import { valueAnchor } from './useEditorPlacement';
import type { RuleWindow } from './useRuleWindow';
import { ValuePopover, type ValuePopoverHandle, type ValuePopoverProps } from './ValuePopover';

/** The open value's editor as the view derives it; the host's editor, the strings and the testid come apart. */
export type OpenValueEditor = Omit<
  ValuePopoverProps,
  'ref' | 'renderEditor' | 'labels' | 'onOperatorChange' | 'dataTestId'
>;

export interface ValueEditorOverlayProps
  extends Pick<ValuePopoverProps, 'renderEditor' | 'labels' | 'onOperatorChange'> {
  editor: OpenValueEditor;
  container: RuleWindow['container'];
  dataTestId: string;
}

/** The open value's popover, over the rules at its value; a press outside applies it in place. */
export const ValueEditorOverlay: React.FC<ValueEditorOverlayProps> = ({
  editor,
  renderEditor,
  labels,
  onOperatorChange,
  container,
  dataTestId,
}) => {
  const popoverRef = useRef<ValuePopoverHandle>(null);
  return (
    <EditorOverlay
      anchor={valueAnchor(editor.target)}
      container={container}
      ariaLabel={editor.ariaLabel}
      className={VALUE_EDITOR_CLASS}
      dataTestId={`${dataTestId}-value-editor`}
      onPressOutside={() => popoverRef.current?.apply()}
      onCancel={editor.onCancel}
    >
      <ValuePopover
        {...editor}
        ref={popoverRef}
        renderEditor={renderEditor}
        labels={labels}
        onOperatorChange={onOperatorChange}
        dataTestId={`${dataTestId}-editor`}
      />
    </EditorOverlay>
  );
};
