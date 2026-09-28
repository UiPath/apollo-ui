import type { CentralizedGuardrailsLabels } from '../i18n';
import { GuardrailStatusChip } from './guardrail-status-chip';

export interface CentralizedGuardrailOriginChipProps {
  isByo?: boolean | null;
  labels: CentralizedGuardrailsLabels;
}

/** BYO or UiPath-managed: a connector can reuse a built-in's validator id, so rows look alike. */
export function CentralizedGuardrailOriginChip({
  isByo,
  labels,
}: CentralizedGuardrailOriginChipProps) {
  return isByo ? (
    <GuardrailStatusChip tone="success" className="shrink-0">
      {labels.originByo}
    </GuardrailStatusChip>
  ) : (
    <GuardrailStatusChip tone="neutral" className="shrink-0">
      {labels.originUiPath}
    </GuardrailStatusChip>
  );
}
