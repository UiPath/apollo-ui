import type { CustomFieldComponentProps } from '@uipath/apollo-wind';
import { FormField, FormFieldError } from '@uipath/apollo-wind';
import { useId } from 'react';
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

  const uid = useId();
  const selected = Array.isArray(value) ? (value as string[]) : [];

  /** Friendly label for an option value, falling back to the raw value when unmapped. */
  const labelFor = (option: string) => paramDef.optionLabels?.[option] ?? option;

  const handleToggle = (option: string, pressed: boolean) => {
    onChange(pressed ? [...selected, option] : selected.filter((s) => s !== option));
  };

  return (
    <FormField data-slot="guardrail-enum-list-field">
      {/* The chips are Toggle buttons, not labelable controls, so the label names nothing on its
          own and needs an id for the group to point at. Same treatment as the scope selector:
          without it a screen reader reads individually named buttons with no idea which
          parameter they belong to, or that it is invalid. */}
      <ParameterLabel id={`${uid}-label`} paramDef={paramDef} labels={labels} />
      <FieldShell invalid={Boolean(error)}>
        {/* biome-ignore lint/a11y/useSemanticElements: <fieldset> requires <legend> as its first
            child, which would pull the styled label inside FieldShell and change the layout.
            role=group + aria-labelledby is equivalent for assistive tech.

            No aria-required: not permitted on role=group, and it trips aria-allowed-attr. The
            requirement is carried by the label's RequiredIndicator and by the error when unmet. */}
        <div
          role="group"
          aria-labelledby={`${uid}-label`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-error` : undefined}
          className="flex flex-wrap gap-1.5"
        >
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
      <FormFieldError id={`${uid}-error`}>{error}</FormFieldError>
    </FormField>
  );
}
