import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterLabel } from './parameter-label';

export interface TextParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

/** Text parameters always render multiline. */
export function TextParameterField({
  paramDef,
  value,
  onChange,
  error,
  labels,
}: TextParameterFieldProps) {
  const current =
    value?.$parameterType === 'text'
      ? value.value
      : ((paramDef.defaultValue as string | null) ?? '');
  const inputId = `guardrail-param-${paramDef.id}`;

  return (
    <FormField>
      <ParameterLabel paramDef={paramDef} labels={labels} htmlFor={inputId} />
      <Textarea
        id={inputId}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        minRows={3}
        maxLength={paramDef.maxLength}
        aria-invalid={error ? true : undefined}
      />
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
