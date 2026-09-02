import { Label, RequiredIndicator } from '@/components/ui/label';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition } from '../types';
import { InfoTooltip } from './info-tooltip';

export interface ParameterLabelProps {
  paramDef: GuardrailParameterDefinition;
  labels: GuardrailValidatorFormLabels;
  htmlFor?: string;
  asTextHeader?: boolean;
}

/** Parameter display label with required marker and optional info tooltip. */
export function ParameterLabel({
  paramDef,
  labels,
  htmlFor,
  asTextHeader = false,
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
      <div data-slot="guardrail-parameter-label" className="text-xs font-medium text-foreground">
        {content}
      </div>
    );
  }
  return <Label htmlFor={htmlFor}>{content}</Label>;
}
