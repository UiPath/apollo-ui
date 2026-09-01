import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterError, ParameterLabel } from './parameter-label';

export interface EnumParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

/** Single-select parameter. */
export function EnumParameterField({
  paramDef,
  value,
  onChange,
  error,
  labels,
}: EnumParameterFieldProps) {
  const current =
    value?.$parameterType === 'enum'
      ? value.value
      : ((paramDef.defaultValue as string | null) ?? '');

  const options = useMemo<ReadonlyArray<{ value: string; label: string }>>(() => {
    const backendOptions = (paramDef.options ?? []).map((opt) => ({
      value: opt,
      label: paramDef.optionLabels?.[opt] ?? opt,
    }));
    // A stored value absent from the catalog (e.g. an option removed after the guardrail was
    // saved) is kept as a synthetic option so the field never silently blanks.
    if (current.length > 0 && !backendOptions.some((opt) => opt.value === current)) {
      return [
        ...backendOptions,
        { value: current, label: paramDef.optionLabels?.[current] ?? current },
      ];
    }
    return backendOptions;
  }, [paramDef.options, paramDef.optionLabels, current]);

  const triggerId = `guardrail-param-${paramDef.id}`;

  return (
    <div className="space-y-2">
      <ParameterLabel paramDef={paramDef} labels={labels} htmlFor={triggerId} />
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger id={triggerId} className={cn('h-9', error && 'border-destructive')}>
          <SelectValue placeholder={labels.enumPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ParameterError error={error} />
    </div>
  );
}
