import { createContext, useContext } from 'react';
import type { CustomFieldComponentProps } from '@/components/forms/form-schema';
import type {
  GuardrailParameterDefinition,
  GuardrailValidatorFormProps,
  GuardrailValidatorParameter,
} from './types';

/**
 * Live host context for `renderParameter` overrides. The bridge component below is
 * registered once (as the `guardrail-render-parameter` custom component) while the fresh
 * per-render callbacks and host truth flow through this context — the schema stays a plain
 * serializable object.
 */
export interface GuardrailRenderParameterContextValue {
  renderParameter: GuardrailValidatorFormProps['renderParameter'];
  defsById: Map<string, GuardrailParameterDefinition>;
  /** Host truth — includes sidecar parameters that never enter the form. */
  parameters: GuardrailValidatorParameter[];
  errors?: Record<string, string>;
  updateParam: (def: GuardrailParameterDefinition, value: unknown) => void;
  replaceParams: (paramId: string, next: GuardrailValidatorParameter[]) => void;
}

const GuardrailRenderParameterContext = createContext<GuardrailRenderParameterContextValue | null>(
  null
);

export const GuardrailRenderParameterProvider = GuardrailRenderParameterContext.Provider;

/**
 * Mounts the host's `renderParameter` node for an overridden parameter. `onValueChange`
 * upserts the one parameter; `onParametersChange` hands the host the whole array — the seam
 * overrides use to write sidecar parameters (e.g. a model picker persisting connection
 * metadata) atomically with their own value.
 */
export function RenderParameterBridge(props: CustomFieldComponentProps) {
  const ctx = useContext(GuardrailRenderParameterContext);
  if (!ctx?.renderParameter) return null;
  const def = ctx.defsById.get(props.name);
  if (!def) return null;

  const entry = ctx.parameters.find((p) => p.id === props.name);
  const node = ctx.renderParameter({
    definition: def,
    value: entry?.value,
    error: ctx.errors?.[props.name],
    parameters: ctx.parameters,
    onValueChange: (value) => ctx.updateParam(def, value),
    onParametersChange: (next) => ctx.replaceParams(def.id, next),
  });

  return <>{node ?? null}</>;
}
