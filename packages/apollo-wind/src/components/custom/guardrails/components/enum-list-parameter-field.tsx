import { useCallback, useMemo } from 'react';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import { MultiSelect } from '@/components/ui/multi-select';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { FieldShell } from './field-shell';
import { GuardrailChip } from './guardrail-chip';
import { ParameterLabel } from './parameter-label';

/** Show chips inline when few enough; otherwise use a MultiSelect. */
const MAX_INLINE_OPTIONS = 8;

export interface EnumListParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

/**
 * Multi-select parameter: toggleable chips inline for small option sets, the MultiSelect
 * primitive for large ones.
 */
export function EnumListParameterField({
  paramDef,
  value,
  onChange,
  error,
  labels,
}: EnumListParameterFieldProps) {
  const selected = useMemo(
    () =>
      (value?.$parameterType === 'enum-list' ? value.value : (paramDef.defaultValue as string[])) ??
      [],
    [value, paramDef.defaultValue]
  );

  const handleToggle = useCallback(
    (option: string, checked: boolean) => {
      const newSelection = checked ? [...selected, option] : selected.filter((s) => s !== option);
      onChange(newSelection);
    },
    [selected, onChange]
  );

  const options = paramDef.options ?? [];
  const showInline = options.length <= MAX_INLINE_OPTIONS;

  /** Friendly label for an option value, falling back to the raw value when unmapped. */
  const labelFor = (option: string) => paramDef.optionLabels?.[option] ?? option;

  return (
    <FormField data-slot="guardrail-enum-list-field">
      <ParameterLabel paramDef={paramDef} labels={labels} />
      {showInline ? (
        <FieldShell invalid={Boolean(error)}>
          <div className="flex flex-wrap gap-1.5">
            {options.map((option) => (
              <GuardrailChip
                key={option}
                pressed={selected.includes(option)}
                onPressedChange={(pressed) => handleToggle(option, pressed)}
              >
                {labelFor(option)}
              </GuardrailChip>
            ))}
          </div>
        </FieldShell>
      ) : (
        <MultiSelect
          options={options.map((option) => ({ value: option, label: labelFor(option) }))}
          selected={selected}
          onChange={(next) => onChange(next)}
          placeholder={labels.enumListPlaceholder}
          aria-invalid={error ? true : undefined}
        />
      )}
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
