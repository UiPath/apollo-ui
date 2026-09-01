import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition } from '../types';

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
      {paramDef.label} {paramDef.required && <span className="text-destructive">*</span>}
      {paramDef.tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={labels.moreInformation}
              className="inline-flex items-center justify-center align-text-bottom ml-1 rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[300px]">
            {paramDef.tooltip}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
  if (asTextHeader) {
    return <div className="text-sm font-medium">{content}</div>;
  }
  return <Label htmlFor={htmlFor}>{content}</Label>;
}

/** Inline error message shown under a parameter editor. */
export function ParameterError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-destructive">{error}</p>;
}
