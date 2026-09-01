import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib';
import { BooleanParameterField } from './components/boolean-parameter-field';
import { EnumListParameterField } from './components/enum-list-parameter-field';
import { EnumParameterField } from './components/enum-parameter-field';
import { MapEnumParameterField } from './components/map-enum-parameter-field';
import { NumberParameterField } from './components/number-parameter-field';
import { TextListParameterField } from './components/text-list-parameter-field';
import { TextParameterField } from './components/text-parameter-field';
import { type GuardrailValidatorFormLabels, resolveGuardrailFormLabels } from './i18n';
import { loadGuardrailValidatorFormMessages } from './load-messages';
import type {
  GuardrailParameterDefinition,
  GuardrailValidatorFormProps,
  GuardrailValidatorParameter,
} from './types';

/**
 * Resolve the component's chrome strings: English synchronously, then the locale catalog
 * once loaded, with per-string `labels` overrides always winning.
 */
function useGuardrailFormLabels(
  locale?: string,
  overrides?: Partial<GuardrailValidatorFormLabels>
): GuardrailValidatorFormLabels {
  const [catalog, setCatalog] = useState<Partial<GuardrailValidatorFormLabels>>({});

  useEffect(() => {
    if (!locale) {
      setCatalog({});
      return;
    }
    let cancelled = false;
    loadGuardrailValidatorFormMessages(locale).then((messages) => {
      if (!cancelled) setCatalog(messages);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return useMemo(() => resolveGuardrailFormLabels(catalog, overrides), [catalog, overrides]);
}

/**
 * Renders the configuration section of an OOTB guardrail validator: one editor per parameter
 * definition, covering all seven parameter types (`number`, `text`, `boolean`, `enum`,
 * `enum-list`, `text-list`, `map-enum`).
 *
 * Fully controlled and validation-free: the host owns values (`parameters` + `onChange`) and
 * validation (`errors` + `onClearError`); compute required-field errors with
 * `getRequiredEmptyParameterIds`. Individual parameters can be replaced via
 * `renderParameter` (e.g. to mount a product model picker for a judge-model parameter).
 */
export const GuardrailValidatorForm = forwardRef<HTMLDivElement, GuardrailValidatorFormProps>(
  (
    {
      parameterDefinitions,
      parameters,
      onChange,
      errors,
      onClearError,
      renderParameter,
      locale,
      labels: labelOverrides,
      className,
    },
    ref
  ) => {
    const labels = useGuardrailFormLabels(locale, labelOverrides);

    const getParamEntry = useCallback(
      (paramId: string): GuardrailValidatorParameter | undefined =>
        parameters.find((p) => p.id === paramId),
      [parameters]
    );

    const updateParam = useCallback(
      (paramDef: GuardrailParameterDefinition, value: unknown) => {
        onClearError?.(paramDef.id);
        const existing = parameters.findIndex((p) => p.id === paramDef.id);
        const newParam = {
          $parameterType: paramDef.type,
          id: paramDef.id,
          value,
        } as GuardrailValidatorParameter;
        const newParams = [...parameters];
        if (existing >= 0) {
          newParams[existing] = newParam;
        } else {
          newParams.push(newParam);
        }
        onChange(newParams);
      },
      [parameters, onChange, onClearError]
    );

    const replaceParams = useCallback(
      (paramId: string, next: GuardrailValidatorParameter[]) => {
        onClearError?.(paramId);
        onChange(next);
      },
      [onChange, onClearError]
    );

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {parameterDefinitions.map((paramDef) => {
          const entry = getParamEntry(paramDef.id);
          const error = errors?.[paramDef.id];
          const onValueChange = (value: unknown) => updateParam(paramDef, value);

          const custom = renderParameter?.({
            definition: paramDef,
            value: entry?.value,
            error,
            parameters,
            onValueChange,
            onParametersChange: (next) => replaceParams(paramDef.id, next),
          });
          if (custom !== undefined) {
            return <div key={paramDef.id}>{custom}</div>;
          }

          switch (paramDef.type) {
            case 'enum-list':
              return (
                <EnumListParameterField
                  key={paramDef.id}
                  paramDef={paramDef}
                  value={entry}
                  onChange={onValueChange}
                  error={error}
                  labels={labels}
                />
              );
            case 'map-enum':
              return (
                <MapEnumParameterField
                  key={paramDef.id}
                  paramDef={paramDef}
                  value={entry}
                  allParameters={parameters}
                  allParamDefs={parameterDefinitions}
                  onChange={onValueChange}
                  error={error}
                  labels={labels}
                />
              );
            case 'number':
              return (
                <NumberParameterField
                  key={paramDef.id}
                  paramDef={paramDef}
                  value={entry}
                  onChange={onValueChange}
                  error={error}
                  labels={labels}
                />
              );
            case 'text':
              return (
                <TextParameterField
                  key={paramDef.id}
                  paramDef={paramDef}
                  value={entry}
                  onChange={onValueChange}
                  error={error}
                  labels={labels}
                />
              );
            case 'enum':
              return (
                <EnumParameterField
                  key={paramDef.id}
                  paramDef={paramDef}
                  value={entry}
                  onChange={onValueChange}
                  error={error}
                  labels={labels}
                />
              );
            case 'text-list':
              return (
                <TextListParameterField
                  key={paramDef.id}
                  paramDef={paramDef}
                  value={entry}
                  onChange={onValueChange}
                  error={error}
                  labels={labels}
                />
              );
            case 'boolean':
              return (
                <BooleanParameterField
                  key={paramDef.id}
                  paramDef={paramDef}
                  value={entry}
                  onChange={onValueChange}
                  error={error}
                  labels={labels}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }
);
GuardrailValidatorForm.displayName = 'GuardrailValidatorForm';
