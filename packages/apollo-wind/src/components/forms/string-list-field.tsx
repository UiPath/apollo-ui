import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField, FormFieldDescription, FormFieldError } from '@/components/ui/form-field';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { RequiredIndicator } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { StringListFieldMetadata } from './form-schema';

/** Interpolate `{{token}}` placeholders; unknown tokens are left untouched. */
export function formatTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, token: string) =>
    token in values ? String(values[token]) : match
  );
}

export interface StringListFieldProps {
  field: StringListFieldMetadata;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  /** Forwarded to every row so blur-mode validation and touched state work. */
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Repeated multiline rows with Add / Remove — the `string-list` field type.
 *
 * Rendering it standalone with `field.tooltip` set requires an ancestor `TooltipProvider`:
 * the info trigger is a Radix tooltip, which throws without one. Inside `MetadataForm` this
 * is handled for you — it mounts a provider for schemas that use tooltip metadata.
 */
export function StringListField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
}: StringListFieldProps) {
  const items = value ?? [];
  const maxItems = field.maxItems ?? Number.POSITIVE_INFINITY;
  const canAdd = !disabled && items.length < maxItems;
  const addItemLabel = field.addItemLabel ?? 'Add';
  const removeItemAriaLabel = field.removeItemAriaLabel ?? 'Remove {{label}} {{position}}';

  // Stable per-row ids: without them, removing index N would reuse the DOM node of a
  // surviving sibling and swap a focused textarea's content with someone else's. Resync
  // during render (React's official pattern) when the `items` array length changes
  // out-of-band; the local add/remove handlers below already mutate ids in lockstep.
  const [rowIds, setRowIds] = useState<string[]>(() => items.map(() => crypto.randomUUID()));
  const [prevLength, setPrevLength] = useState(items.length);
  if (prevLength !== items.length) {
    setPrevLength(items.length);
    setRowIds((prev) =>
      prev.length < items.length
        ? [
            ...prev,
            ...Array.from({ length: items.length - prev.length }, () => crypto.randomUUID()),
          ]
        : prev.slice(0, items.length)
    );
  }

  const addItem = useCallback(() => {
    setRowIds((prev) => [...prev, crypto.randomUUID()]);
    onChange([...items, '']);
  }, [items, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      setRowIds((prev) => prev.filter((_, i) => i !== index));
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  const updateItem = useCallback(
    (index: number, next: string) => {
      onChange(items.map((item, i) => (i === index ? next : item)));
    },
    [items, onChange]
  );

  return (
    <FormField data-slot="string-list-field">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">
          {field.label}
          {required && <RequiredIndicator />}
          {field.tooltip && (
            <InfoTooltip
              content={field.tooltip}
              aria-label={field.tooltipAriaLabel ?? 'More information'}
            />
          )}
        </span>
        {canAdd && (
          <Button type="button" variant="ghost" size="2xs" onClick={addItem}>
            <Plus />
            {addItemLabel}
          </Button>
        )}
      </div>
      <div className="grid gap-1.5">
        {items.map((item, index) => (
          <div key={rowIds[index] ?? index} className="flex items-start gap-2">
            <Textarea
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              onBlur={onBlur}
              minRows={field.minRows ?? 2}
              maxLength={field.maxLength}
              disabled={disabled}
              aria-label={`${field.label} ${index + 1}`}
              // The error belongs to the list as a whole, so every row carries the invalid
              // state: it drives Textarea's aria-invalid styling and gives assistive tech
              // the signal that the FormFieldError text below is about these inputs.
              aria-invalid={error ? true : undefined}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon
              disabled={disabled}
              onClick={() => removeItem(index)}
              aria-label={formatTemplate(removeItemAriaLabel, {
                label: field.label,
                position: index + 1,
              })}
              className="shrink-0 text-muted-foreground"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <FormFieldDescription>{field.description}</FormFieldDescription>
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
