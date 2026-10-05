import { useState } from 'react';
import { FormFieldError } from '@/components/ui/form-field';
import { cn } from '@/lib';
import { EditorActions, EditorTextarea } from './EditorChrome';
import type { JsonTreeNode, JsonValue, RenderCodeEditor } from './JsonTree.types';
import { useJsonTreeViewStrings } from './strings';

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
  const strings = useJsonTreeViewStrings();
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
    } catch (error) {
      setError(
        error instanceof Error ? `${strings.invalidJson}: ${error.message}` : strings.invalidJson
      );
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5 [&>[data-slot=form-field-error]]:mt-0', className)}>
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
          ariaLabel={strings.editJsonOf(node.key)}
        />
      )}
      <FormFieldError>{error}</FormFieldError>
      <EditorActions onApply={apply} onCancel={onCancel} />
    </div>
  );
}
