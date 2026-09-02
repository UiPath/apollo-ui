import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Switch } from '@/components/ui/switch';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterLabel } from './parameter-label';

export interface BooleanParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

export function BooleanParameterField({
  paramDef,
  value,
  onChange,
  error,
  labels,
}: BooleanParameterFieldProps) {
  const current =
    value?.$parameterType === 'boolean'
      ? value.value
      : ((paramDef.defaultValue as boolean | null | undefined) ?? false);
  const switchId = `guardrail-param-${paramDef.id}`;

  return (
    <FormField>
      <div className="flex items-center gap-2">
        <Switch id={switchId} checked={current} onCheckedChange={(checked) => onChange(checked)} />
        <ParameterLabel paramDef={paramDef} labels={labels} htmlFor={switchId} />
      </div>
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
