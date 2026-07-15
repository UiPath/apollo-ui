import { Button, cn } from '@uipath/apollo-wind';
import { useEffect, useRef } from 'react';
import { useSafeLingui } from '../../../i18n';

/** Apply/Cancel row shared by the multiline editors. */
export function EditorActions({
  onApply,
  onCancel,
  applyDisabled = false,
}: {
  onApply: () => void;
  onCancel: () => void;
  applyDisabled?: boolean;
}) {
  const { _ } = useSafeLingui();
  return (
    <div className="flex items-center gap-1.5">
      <Button size="3xs" onClick={onApply} disabled={applyDisabled}>
        {_({ id: 'canvas.json_value_panel.apply', message: 'Apply' })}
      </Button>
      <Button size="3xs" variant="ghost" onClick={onCancel}>
        {_({ id: 'canvas.json_value_panel.cancel', message: 'Cancel' })}
      </Button>
    </div>
  );
}

export interface EditorTextareaProps {
  value: string;
  onChange: (value: string) => void;
  /** Bound to Ctrl/Cmd+Enter. */
  onApply: () => void;
  /** Bound to Escape (contained so a host dialog does not also close). */
  onCancel: () => void;
  invalid: boolean;
  rows: number;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}

/** Multiline editing surface shared by the leaf and container editors. */
export function EditorTextarea({
  value,
  onChange,
  onApply,
  onCancel,
  invalid,
  rows,
  ariaLabel,
  placeholder,
  className,
}: EditorTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mounted in response to the user's edit action; focus follows it (the
  // attribute form trips a11y linting).
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // preventDefault (not just stopPropagation): a host that closes on
          // Escape via a document-level listener (e.g. Radix Dialog) reads the
          // native event's defaultPrevented flag, which crosses the portal
          // boundary reliably — React synthetic stopPropagation does not.
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onApply();
      }}
      rows={rows}
      spellCheck={false}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      placeholder={placeholder}
      className={cn(
        'w-full resize-y rounded-lg border bg-surface p-2 font-mono text-xs leading-5 text-foreground outline-none',
        invalid ? 'border-error' : 'border-border-subtle focus:border-brand',
        className
      )}
    />
  );
}
