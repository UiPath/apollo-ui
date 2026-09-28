import { InfoTooltip, Label, Switch } from '@uipath/apollo-wind';
import type { GuardrailBuilderLabels } from '../i18n';

export interface GuardrailEvalsToggleProps {
  /** Prefix of the switch id, `${idPrefix}-enable-evals`. */
  idPrefix: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  labels: Pick<GuardrailBuilderLabels, 'evalsLabel' | 'evalsTooltip' | 'evalsInfoAriaLabel'>;
}

/** The enable-for-evaluations switch, rendered in the form body or the footer. */
export function GuardrailEvalsToggle({
  idPrefix,
  checked,
  onCheckedChange,
  labels,
}: GuardrailEvalsToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={`${idPrefix}-enable-evals`} checked={checked} onCheckedChange={onCheckedChange} />
      <Label variant="muted" htmlFor={`${idPrefix}-enable-evals`} className="cursor-pointer">
        {labels.evalsLabel}
      </Label>
      <InfoTooltip content={labels.evalsTooltip} aria-label={labels.evalsInfoAriaLabel} />
    </div>
  );
}
