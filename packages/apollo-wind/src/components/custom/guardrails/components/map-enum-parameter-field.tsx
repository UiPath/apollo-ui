import { useCallback, useMemo } from 'react';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterLabel } from './parameter-label';

export interface MapEnumParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  /** All current parameter values; the row keys come from the `keySource` sibling's selection. */
  allParameters: GuardrailValidatorParameter[];
  allParamDefs: GuardrailParameterDefinition[];
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

/**
 * One numeric input per key selected in the sibling `keySource` enum-list parameter (e.g. a
 * threshold per selected PII entity). Renders nothing while the source has no selection.
 * Edits never prune keys removed from the source; reconcile at save time with
 * `syncMapEnumParameters`.
 */
export function MapEnumParameterField({
  paramDef,
  value,
  allParameters,
  allParamDefs,
  onChange,
  error,
  labels,
}: MapEnumParameterFieldProps) {
  const currentMap = useMemo(
    () =>
      (value?.$parameterType === 'map-enum'
        ? value.value
        : (paramDef.defaultValue as Record<string, number>)) ?? {},
    [value, paramDef.defaultValue]
  );

  // Per-entity defaults shipped by the backend (e.g. every PII entity at 0.5). Used as the
  // displayed value for a freshly selected entity that isn't in the current map yet, so the
  // user sees the real default rather than a misleading 0. Mirrors the save-time fallback in
  // `syncMapEnumParameters`.
  const defaults = useMemo(
    () => (paramDef.defaultValue as Record<string, number> | undefined) ?? {},
    [paramDef.defaultValue]
  );

  // Get keys from the source parameter's current selection
  const sourceParamDef = allParamDefs.find((p) => p.id === paramDef.keySource);
  const sourceParam = allParameters.find((p) => p.id === paramDef.keySource);
  const keys =
    (sourceParam?.$parameterType === 'enum-list' ? sourceParam.value : undefined) ??
    (sourceParamDef?.defaultValue as string[] | undefined) ??
    [];

  const handleThresholdChange = useCallback(
    (key: string, threshold: number) => {
      onChange({ ...currentMap, [key]: threshold });
    },
    [currentMap, onChange]
  );

  if (keys.length === 0) return null;

  return (
    <FormField>
      <ParameterLabel paramDef={paramDef} labels={labels} />
      <div className="grid gap-1.5">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <Label variant="muted" className="w-1/3 truncate">
              {sourceParamDef?.optionLabels?.[key] ?? key}
            </Label>
            <Input
              aria-label={`${paramDef.label}: ${sourceParamDef?.optionLabels?.[key] ?? key}`}
              type="number"
              value={currentMap[key] ?? defaults[key] ?? paramDef.min ?? 0}
              onChange={(e) => handleThresholdChange(key, Number.parseFloat(e.target.value) || 0)}
              min={paramDef.min}
              max={paramDef.max}
              step={paramDef.step}
              className="flex-1"
            />
          </div>
        ))}
      </div>
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
