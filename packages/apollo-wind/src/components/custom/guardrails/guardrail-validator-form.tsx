import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MetadataForm } from '@/components/forms/metadata-form';
import { cn } from '@/lib';
import { EnumListChipsField } from './components/enum-list-chips-field';
import { MapEnumField } from './components/map-enum-field';
import {
  buildGuardrailFormSchema,
  coerceGuardrailParameterValue,
  GUARDRAIL_ENUM_LIST_CHIPS_COMPONENT,
  GUARDRAIL_MAP_ENUM_COMPONENT,
  GUARDRAIL_RENDER_PARAMETER_COMPONENT,
} from './form-schema-builder';
import { type GuardrailValidatorFormLabels, resolveGuardrailFormLabels } from './i18n';
import { loadGuardrailMessages } from './load-messages';
import { GuardrailRenderParameterProvider, RenderParameterBridge } from './render-parameter-bridge';
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
    loadGuardrailMessages(locale).then((messages) => {
      if (!cancelled) setCatalog(messages);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return useMemo(() => resolveGuardrailFormLabels(catalog, overrides), [catalog, overrides]);
}

const GUARDRAIL_CUSTOM_COMPONENTS = {
  [GUARDRAIL_ENUM_LIST_CHIPS_COMPONENT]: EnumListChipsField,
  [GUARDRAIL_MAP_ENUM_COMPONENT]: MapEnumField,
  [GUARDRAIL_RENDER_PARAMETER_COMPONENT]: RenderParameterBridge,
};

const EMPTY_OVERRIDES: ReadonlySet<string> = new Set();

/**
 * Renders the configuration section of an OOTB guardrail validator: one editor per parameter
 * definition, covering all seven parameter types (`number`, `text`, `boolean`, `enum`,
 * `enum-list`, `text-list`, `map-enum`).
 *
 * Internally this is `buildGuardrailFormSchema` + the forms/ `MetadataForm` stack (see
 * README, "Built on the forms/ MetadataForm stack"): five parameter types map onto
 * first-class field types, while the chip-style enum-list, `map-enum`, and `renderParameter`
 * overrides register as custom field components. The public contract is unchanged — fully
 * controlled and validation-free: the host owns values (`parameters` + `onChange`, echoed
 * back synchronously) and validation (`errors` + `onClearError`); compute required-field
 * errors with `getRequiredEmptyParameterIds`. Parameters the host's `parameters` array
 * carries without a matching definition (sidecars written via `onParametersChange`, e.g. a
 * model picker's connection metadata) never enter the form and round-trip untouched.
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

    const defsById = useMemo(
      () => new Map(parameterDefinitions.map((d) => [d.id, d])),
      [parameterDefinitions]
    );

    // Host truth, read at emit time — the carrier for sidecar parameters and the base every
    // upsert starts from, so untouched defaults never leak into the emitted array.
    const parametersRef = useRef(parameters);
    parametersRef.current = parameters;

    const updateParam = useCallback(
      (paramDef: GuardrailParameterDefinition, value: unknown) => {
        onClearError?.(paramDef.id);
        const current = parametersRef.current;
        const existing = current.findIndex((p) => p.id === paramDef.id);
        const newParam = {
          $parameterType: paramDef.type,
          id: paramDef.id,
          value,
        } as GuardrailValidatorParameter;
        const newParams = [...current];
        if (existing >= 0) {
          newParams[existing] = newParam;
        } else {
          newParams.push(newParam);
        }
        onChange(newParams);
      },
      [onChange, onClearError]
    );

    const replaceParams = useCallback(
      (paramId: string, next: GuardrailValidatorParameter[]) => {
        onClearError?.(paramId);
        onChange(next);
      },
      [onChange, onClearError]
    );

    // Which definitions the override claims — probed the way the pre-convergence form probed
    // on every render: call it and check for undefined-fallthrough. Overrides are expected to
    // discriminate on the definition (id/type), not on transient values.
    const overriddenIds = useMemo(() => {
      if (!renderParameter) return EMPTY_OVERRIDES;
      const ids = new Set<string>();
      for (const def of parameterDefinitions) {
        const entry = parameters.find((p) => p.id === def.id);
        const node = renderParameter({
          definition: def,
          value: entry?.value,
          error: errors?.[def.id],
          parameters,
          onValueChange: () => {},
          onParametersChange: () => {},
        });
        if (node !== undefined) ids.add(def.id);
      }
      return ids;
    }, [renderParameter, parameterDefinitions, parameters, errors]);

    // A stored enum value missing from the option catalog stays visible as a synthetic option.
    const enumSyntheticValues = useMemo(() => {
      const map: Record<string, string> = {};
      for (const def of parameterDefinitions) {
        if (def.type !== 'enum') continue;
        const entry = parameters.find((p) => p.id === def.id);
        const value =
          entry?.$parameterType === 'enum'
            ? entry.value
            : ((def.defaultValue as string | null) ?? '');
        if (value.length > 0 && !(def.options ?? []).includes(value)) {
          map[def.id] = value;
        }
      }
      return map;
    }, [parameterDefinitions, parameters]);

    // Frozen at mount so keystrokes never churn schema identity: it only seeds field
    // defaultValues for the first paint. Later external changes arrive via `values`.
    const [initialParameters] = useState(parameters);

    const schema = useMemo(
      () =>
        buildGuardrailFormSchema(parameterDefinitions, labels, {
          overriddenIds,
          initialParameters,
          enumSyntheticValues,
        }),
      [parameterDefinitions, labels, overriddenIds, initialParameters, enumSyntheticValues]
    );

    // parameters -> record: only ids with a definition enter the form; sidecars stay in
    // parametersRef and round-trip untouched.
    const values = useMemo(() => {
      const record: Record<string, unknown> = {};
      for (const p of parameters) {
        if (defsById.has(p.id)) record[p.id] = p.value;
      }
      return record;
    }, [parameters, defsById]);

    const handleValuesChange = useCallback(
      (record: Record<string, unknown>, changedField: string) => {
        const def = defsById.get(changedField);
        if (!def) return;
        updateParam(def, coerceGuardrailParameterValue(record[changedField], def));
      },
      [defsById, updateParam]
    );

    const bridgeContext = useMemo(
      () => ({ renderParameter, defsById, parameters, errors, updateParam, replaceParams }),
      [renderParameter, defsById, parameters, errors, updateParam, replaceParams]
    );

    return (
      <div ref={ref} data-slot="guardrail-validator-form" className={cn('space-y-4', className)}>
        <GuardrailRenderParameterProvider value={bridgeContext}>
          <MetadataForm
            schema={schema}
            values={values}
            onValuesChange={handleValuesChange}
            errors={errors}
            disableValidation
            container="div"
            components={GUARDRAIL_CUSTOM_COMPONENTS}
          />
        </GuardrailRenderParameterProvider>
      </div>
    );
  }
);
GuardrailValidatorForm.displayName = 'GuardrailValidatorForm';
