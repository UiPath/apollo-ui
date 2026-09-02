import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { formatGuardrailFormMessage, type GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterLabel } from './parameter-label';

export interface TextListParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

/** Repeated multiline rows with Add / Remove. */
export function TextListParameterField({
  paramDef,
  value,
  onChange,
  error,
  labels,
}: TextListParameterFieldProps) {
  const items = useMemo<string[]>(
    () =>
      value?.$parameterType === 'text-list'
        ? value.value
        : ((paramDef.defaultValue as string[] | null | undefined) ?? []),
    [value, paramDef.defaultValue]
  );
  const maxItems = paramDef.maxItems ?? Number.POSITIVE_INFINITY;
  const canAdd = items.length < maxItems;

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
    <FormField>
      <div className="flex items-center justify-between">
        <ParameterLabel paramDef={paramDef} labels={labels} asTextHeader />
        {canAdd && (
          <Button type="button" variant="ghost" size="2xs" onClick={addItem}>
            <Plus />
            {labels.addItem}
          </Button>
        )}
      </div>
      <div className="grid gap-1.5">
        {items.map((item, index) => (
          <div key={rowIds[index] ?? index} className="flex items-start gap-2">
            <Textarea
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              minRows={2}
              maxLength={paramDef.maxLength}
              aria-label={`${paramDef.label} ${index + 1}`}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon
              onClick={() => removeItem(index)}
              aria-label={formatGuardrailFormMessage(labels.removeItem, {
                label: paramDef.label,
                position: index + 1,
              })}
              className="shrink-0 text-muted-foreground"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
