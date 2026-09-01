import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatGuardrailFormMessage, type GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterError, ParameterLabel } from './parameter-label';

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <ParameterLabel paramDef={paramDef} labels={labels} asTextHeader />
        {canAdd && (
          <Button type="button" variant="ghost" size="sm" onClick={addItem} className="h-7 px-2">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {labels.addItem}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={rowIds[index] ?? index} className="flex items-start gap-2">
            <Textarea
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              rows={2}
              maxLength={paramDef.maxLength}
              aria-label={`${paramDef.label} ${index + 1}`}
              className="resize-y flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              aria-label={formatGuardrailFormMessage(labels.removeItem, {
                label: paramDef.label,
                position: index + 1,
              })}
              className="h-9 w-9 shrink-0 text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <ParameterError error={error} />
    </div>
  );
}
