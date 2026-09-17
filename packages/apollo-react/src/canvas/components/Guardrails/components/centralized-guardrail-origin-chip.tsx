import type { CentralizedGuardrailsLabels } from '../i18n';
import { GuardrailStatusChip } from './guardrail-status-chip';

export interface CentralizedGuardrailOriginChipProps {
  isByo?: boolean | null;
  labels: CentralizedGuardrailsLabels;
}

/**
 * Marks where a centralized guardrail comes from. Not decoration: a connector can expose a
 * validator id a built-in also uses, so without the chip two rows that enforce very different
 * things look identical.
 */
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
