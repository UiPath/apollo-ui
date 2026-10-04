import type { CustomFieldComponentProps } from '@uipath/apollo-wind';
import { createContext, type ReactNode, useContext } from 'react';

const GuardrailParameterFootersContext = createContext<
  Readonly<Record<string, ReactNode>> | undefined
>(undefined);

export const GuardrailParameterFootersProvider = GuardrailParameterFootersContext.Provider;

/**
 * Mounts the host's `parameterFooters` node for the parameter above it, registered as the
 * `guardrail-parameter-footer` custom component. The node flows through context, so the schema
 * stays a plain object.
 */
export function ParameterFooterBridge(props: CustomFieldComponentProps) {
  const footers = useContext(GuardrailParameterFootersContext);
  return (
    // Pulls the row from the grid's gap-4 up to the field's own gap-1.5, so it reads as part of it.
    <div data-slot="guardrail-parameter-footer" className="-mt-2.5">
      {footers?.[props.parameterId as string]}
    </div>
  );
}
