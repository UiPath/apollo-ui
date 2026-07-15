import { cn } from '@uipath/apollo-wind';
import { useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { EditorActions, EditorTextarea } from './EditorChrome';
import type { JsonTreeNode, JsonValue } from './JsonTree.types';
import { isNumericEdit, parseLeafValue, resolveLeafEditType } from './leafEditTypes';

export interface JsonMultilineLeafEditorProps {
  node: JsonTreeNode;
  onCommit: (value: JsonValue) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Multiline editor for scalar leaves, used by the expanded row view so long
 * values can wrap. Applies with the Apply button or Ctrl/Cmd+Enter; Escape
 * cancels. Commits with the same type rules as the inline leaf editor.
 */
export function JsonMultilineLeafEditor({
  node,
  onCommit,
  onCancel,
  className,
}: JsonMultilineLeafEditorProps) {
  const { _ } = useSafeLingui();
  const editType = resolveLeafEditType(node.type, node.schema);
  const initial =
    node.value === undefined || node.value === null
      ? String(node.schema?.default ?? '')
      : String(node.value);
  const [raw, setRaw] = useState(initial);
  const invalid = parseLeafValue(raw, editType) === undefined;

  const apply = () => {
    const parsed = parseLeafValue(raw, editType);
    if (parsed === undefined) return;
    onCommit(parsed);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <EditorTextarea
        value={raw}
        onChange={setRaw}
        onApply={apply}
        onCancel={onCancel}
        invalid={invalid}
        rows={Math.min(10, Math.max(3, raw.split('\n').length + 1))}
        ariaLabel={_({
          id: 'canvas.json_value_panel.edit_value_of',
          message: 'Edit value of {key}',
          values: { key: node.key },
        })}
        placeholder={
          isNumericEdit(editType)
            ? _({
                id: 'canvas.json_value_panel.enter_number',
                message: 'Enter a number',
              })
            : _({
                id: 'canvas.json_value_panel.enter_value',
                message: 'Enter a value',
              })
        }
        className="whitespace-pre-wrap"
      />
      <EditorActions onApply={apply} onCancel={onCancel} applyDisabled={invalid} />
    </div>
  );
}
