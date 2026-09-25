import { FormField, FormFieldError, FormFieldLabel } from '@uipath/apollo-wind';
import { useId } from 'react';
import { GuardrailFieldPicker } from './components/guardrail-field-picker';
import {
  type GuardrailFilterFieldSelectorLabels,
  useGuardrailFilterFieldSelectorLabels,
} from './i18n';
import type { GuardrailFieldGroup, GuardrailFieldReference } from './rules-types';
import { toggleGuardrailFieldReference } from './rules-utils';

export interface GuardrailFilterFieldSelectorProps {
  /** The tool's fields, of any type. Absent when the tool has no schema. */
  fields?: GuardrailFieldGroup | null;
  /** The filter action's current fields. */
  value: readonly GuardrailFieldReference[];
  /** Receives the whole next field list. */
  onChange: (fields: GuardrailFieldReference[]) => void;
  /**
   * The `filterFields` message. Rendered here and tied to the trigger; leave it off the action
   * section's `errors` when passing it, or it renders twice.
   */
  error?: string;
  /** Per-string overrides; anything omitted resolves from the canvas lingui catalog. */
  labels?: Partial<GuardrailFilterFieldSelectorLabels>;
  className?: string;
}

/**
 * The field picker of a filter action: which tool input and output fields the guardrail removes.
 * Made for `GuardrailActionSection`'s `filterContent`. Requires an ancestor `TooltipProvider`.
 */
export function GuardrailFilterFieldSelector({
  fields,
  value,
  onChange,
  error,
  labels: labelOverrides,
  className,
}: GuardrailFilterFieldSelectorProps) {
  const labels = useGuardrailFilterFieldSelectorLabels(labelOverrides);
  const uid = useId();

  return (
    <div data-slot="guardrail-filter-field-selector" className={className}>
      {fields ? (
        <GuardrailFieldPicker
          id={`${uid}-fields`}
          labelId={`${uid}-label`}
          label={labels.filterFieldsLabel}
          tooltip={labels.filterFieldsTooltip}
          fields={fields}
          selected={value}
          onToggle={(field) => onChange(toggleGuardrailFieldReference(value, field))}
          error={error}
          labels={labels}
        />
      ) : (
        <FormField>
          <FormFieldLabel id={`${uid}-label`} required>
            {labels.filterFieldsLabel}
          </FormFieldLabel>
          <p className="text-sm italic text-muted-foreground">{labels.filterNoSchema}</p>
          {/* Still shown without a schema: an empty filter fails validation either way. */}
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      )}
    </div>
  );
}
