import { cn } from '@uipath/apollo-wind';
import { useEffect, useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import type { JsonTreeNode, JsonValue } from './JsonTree.types';
import { isNumericEdit, parseLeafValue, resolveLeafEditType } from './leafEditTypes';

export interface JsonLeafValueEditorProps {
  node: JsonTreeNode;
  onCommit: (value: JsonValue) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Inline editor for scalar leaves (string, number, null). Commits on Enter or
 * blur, cancels on Escape. Invalid numbers are flagged and never committed.
 */
export function JsonLeafValueEditor({
  node,
  onCommit,
  onCancel,
  className,
}: JsonLeafValueEditorProps) {
  const { _ } = useSafeLingui();
  const editType = resolveLeafEditType(node.type, node.schema);
  const initial =
    node.value === undefined || node.value === null
      ? String(node.schema?.default ?? '')
      : String(node.value);
  const [raw, setRaw] = useState(initial);
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const invalid = parseLeafValue(raw, editType) === undefined;

  // The editor mounts in response to the user clicking the value, so focus
  // follows that action (the attribute form trips a11y linting).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = () => {
    const parsed = parseLeafValue(raw, editType);
    if (parsed === undefined) return;
    onCommit(parsed);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={raw}
      inputMode={editType === 'integer' ? 'numeric' : editType === 'number' ? 'decimal' : undefined}
      onChange={(e) => setRaw(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        if (invalid) onCancel();
        else commit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          // Contain Escape here so it cancels the edit without also bubbling
          // to a host that closes on Escape (e.g. a dialog or the panel).
          // preventDefault sets the native event's defaultPrevented flag, which
          // a document-level host listener (Radix Dialog) reads across the
          // portal boundary — synthetic stopPropagation alone does not stop it.
          e.preventDefault();
          e.stopPropagation();
          cancelledRef.current = true;
          onCancel();
        }
      }}
      aria-label={_({
        id: 'canvas.json_value_panel.edit_value_of',
        message: 'Edit value of {key}',
        values: { key: node.key },
      })}
      aria-invalid={invalid || undefined}
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
      className={cn(
        'min-w-0 flex-1 rounded bg-transparent font-mono text-xs text-foreground outline-none ring-1',
        invalid ? 'ring-error' : 'ring-brand',
        className
      )}
    />
  );
}
