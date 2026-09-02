import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterLabel } from './parameter-label';

export interface NumberParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

export function NumberParameterField({
  paramDef,
  value,
  onChange,
  error,
  labels,
}: NumberParameterFieldProps) {
  const current =
    (value?.$parameterType === 'number' ? value.value : (paramDef.defaultValue as number)) ?? 0;
  const inputId = `guardrail-param-${paramDef.id}`;

  return (
    <FormField>
      <ParameterLabel paramDef={paramDef} labels={labels} htmlFor={inputId} />
      <Input
        id={inputId}
        type="number"
        value={current}
        onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
        min={paramDef.min}
        max={paramDef.max}
        step={paramDef.step}
        error={error}
      />
    </FormField>
  );
}
