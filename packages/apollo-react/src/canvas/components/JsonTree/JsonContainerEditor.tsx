import { cn } from '@uipath/apollo-wind';
import { useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { EditorActions, EditorTextarea } from './EditorChrome';
import type { JsonTreeNode, JsonValue, RenderCodeEditor } from './JsonTree.types';

export interface JsonContainerEditorProps {
  node: JsonTreeNode;
  onCommit: (value: JsonValue) => void;
  onCancel: () => void;
  /**
   * Renders the editing surface as a code editor instead of the plain
   * textarea. The Apply/Cancel chrome and error message stay owned here.
   */
  renderCodeEditor?: RenderCodeEditor;
  className?: string;
}

function isValidJson(raw: string): boolean {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

/**
 * Multiline JSON editor for object/array nodes. Applies with the Apply button
 * or Ctrl/Cmd+Enter; Escape cancels. Parse errors block the commit. Consumers
 * can swap the textarea for a real code editor via `renderCodeEditor`.
 */
export function JsonContainerEditor({
  node,
  onCommit,
  onCancel,
  renderCodeEditor,
  className,
}: JsonContainerEditorProps) {
  const { _ } = useSafeLingui();
  const initialValue = node.value ?? (node.type === 'array' ? [] : {});
  const [raw, setRaw] = useState(() => JSON.stringify(initialValue, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setRaw(value);
    setError(null);
  };

  const apply = () => {
    try {
      onCommit(JSON.parse(raw) as JsonValue);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : _({
              id: 'canvas.json_value_panel.invalid_json',
              message: 'Invalid JSON',
            })
      );
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {renderCodeEditor ? (
        renderCodeEditor({
          value: raw,
          onChange: handleChange,
          onApply: apply,
          onCancel,
          invalid: !isValidJson(raw),
          language: 'json',
          autoFocus: true,
        })
      ) : (
        <EditorTextarea
          value={raw}
          onChange={handleChange}
          onApply={apply}
          onCancel={onCancel}
          invalid={!!error}
          rows={Math.min(12, Math.max(3, raw.split('\n').length))}
          ariaLabel={_({
            id: 'canvas.json_value_panel.edit_json_of',
            message: 'Edit JSON of {key}',
            values: { key: node.key },
          })}
        />
      )}
      {error && <p className="text-xs leading-4 text-error">{error}</p>}
      <EditorActions onApply={apply} onCancel={onCancel} />
    </div>
  );
}
