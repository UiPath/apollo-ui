import { InfoTooltip, Label, RequiredIndicator } from '@uipath/apollo-wind';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition } from '../types';

export interface ParameterLabelProps {
  paramDef: GuardrailParameterDefinition;
  labels: GuardrailValidatorFormLabels;
  htmlFor?: string;
  asTextHeader?: boolean;
  /**
   * Names the label element so a non-labelable control can point at it with
   * `aria-labelledby`. Chip groups need this: they are Toggle buttons, so `htmlFor` has
   * nothing to bind to and a bare <label> names nothing.
   */
  id?: string;
}

/** Parameter display label with required marker and optional info tooltip. */
export function ParameterLabel({
  paramDef,
  labels,
  htmlFor,
  asTextHeader = false,
  id,
}: ParameterLabelProps) {
  const content = (
    <>
      {paramDef.label}
      {paramDef.required && <RequiredIndicator />}
      {paramDef.tooltip && (
        <InfoTooltip content={paramDef.tooltip} aria-label={labels.moreInformation} />
      )}
    </>
  );
  if (asTextHeader) {
    return (
      <div
        id={id}
        data-slot="guardrail-parameter-label"
        className="text-xs font-medium text-foreground"
      >
        {content}
      </div>
    );
  }
  return (
    <Label id={id} htmlFor={htmlFor}>
      {content}
    </Label>
  );
}
