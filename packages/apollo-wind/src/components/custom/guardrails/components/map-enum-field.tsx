import { useCallback, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import type { CustomFieldComponentProps } from '@/components/forms/form-schema';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition } from '../types';
import { ParameterLabel } from './parameter-label';

/**
 * One numeric input per key selected in the sibling `keySource` enum-list parameter (e.g. a
 * threshold per selected PII entity), registered as the `guardrail-map-enum` custom
 * component. Reads the sibling's live selection through the form context (`useWatch`),
 * falling back to the source definition's default selection before the sibling registers.
 * Renders nothing while the source has no selection. Edits never prune keys removed from the
 * source; reconcile at save time with `syncMapEnumParameters`. `paramDef`, `sourceDef` and
 * `labels` arrive via `componentProps` from `buildGuardrailFormSchema`.
 */
export function MapEnumField(props: CustomFieldComponentProps) {
  const { value, onChange, error } = props;
  const paramDef = props.paramDef as GuardrailParameterDefinition;
  const sourceDef = props.sourceDef as GuardrailParameterDefinition | undefined;
  const labels = props.labels as GuardrailValidatorFormLabels;
  const sourceSelection = props.sourceSelection as string[] | undefined;

  // Live sibling selection once the sibling emits its first change; until then `useWatch`
  // returns undefined, so fall back to the mount-time selection from the schema builder,
  // then to the source definition's default selection.
  const watchedSelection = useWatch({ name: paramDef.keySource ?? '__guardrail-no-key-source' });
  const keys =
    (Array.isArray(watchedSelection) ? (watchedSelection as string[]) : undefined) ??
    sourceSelection ??
    (sourceDef?.defaultValue as string[] | undefined) ??
    [];

  const currentMap = useMemo(
    () =>
      ((value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : paramDef.defaultValue) as Record<string, number> | undefined) ?? {},
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

  const handleThresholdChange = useCallback(
    (key: string, threshold: number) => {
      onChange({ ...currentMap, [key]: threshold });
    },
    [currentMap, onChange]
  );

  if (keys.length === 0) return null;

  return (
    <FormField data-slot="guardrail-map-enum-field">
      <ParameterLabel paramDef={paramDef} labels={labels} />
      <div className="grid gap-1.5">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <Label variant="muted" className="w-1/3 truncate">
              {sourceDef?.optionLabels?.[key] ?? key}
            </Label>
            <Input
              aria-label={`${paramDef.label}: ${sourceDef?.optionLabels?.[key] ?? key}`}
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
