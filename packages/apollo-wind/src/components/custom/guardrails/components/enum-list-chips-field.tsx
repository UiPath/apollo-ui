import type { CustomFieldComponentProps } from '@/components/forms/form-schema';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition } from '../types';
import { FieldShell } from './field-shell';
import { GuardrailChip } from './guardrail-chip';
import { ParameterLabel } from './parameter-label';

/**
 * Inline chip-toggle editor for enum-list parameters with small option sets (the ≤8 case),
 * registered as the `guardrail-enum-list-chips` custom component; larger sets map to the
 * first-class `multiselect` field type instead. `paramDef` and `labels` arrive via
 * `componentProps` from `buildGuardrailFormSchema`.
 */
export function EnumListChipsField(props: CustomFieldComponentProps) {
  const { value, onChange, error, disabled } = props;
  const paramDef = props.paramDef as GuardrailParameterDefinition;
  const labels = props.labels as GuardrailValidatorFormLabels;

  const selected = Array.isArray(value) ? (value as string[]) : [];

  /** Friendly label for an option value, falling back to the raw value when unmapped. */
  const labelFor = (option: string) => paramDef.optionLabels?.[option] ?? option;

  const handleToggle = (option: string, pressed: boolean) => {
    onChange(pressed ? [...selected, option] : selected.filter((s) => s !== option));
  };

  return (
    <FormField data-slot="guardrail-enum-list-field">
      <ParameterLabel paramDef={paramDef} labels={labels} />
      <FieldShell invalid={Boolean(error)}>
        <div className="flex flex-wrap gap-1.5">
          {(paramDef.options ?? []).map((option) => (
            <GuardrailChip
              key={option}
              pressed={selected.includes(option)}
              onPressedChange={(pressed) => handleToggle(option, pressed)}
              disabled={disabled}
            >
              {labelFor(option)}
            </GuardrailChip>
          ))}
        </div>
      </FieldShell>
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
