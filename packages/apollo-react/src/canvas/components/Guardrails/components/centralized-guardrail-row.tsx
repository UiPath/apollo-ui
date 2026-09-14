import { cn } from '@uipath/apollo-wind';
import { ChevronRight } from 'lucide-react';
import { formatCentralizedExecutionStage } from '../centralized-guardrail-utils';
import type { CentralizedGuardrail, CentralizedGuardrailDefinition } from '../centralized-types';
import type { CentralizedGuardrailsLabels } from '../i18n';
import { formatGuardrailFormMessage } from '../i18n';
import { CentralizedGuardrailOriginChip } from './centralized-guardrail-origin-chip';
import { GuardrailStatusChip } from './guardrail-status-chip';

export interface CentralizedGuardrailRowProps {
  guardrail: CentralizedGuardrail;
  name: string;
  description?: string;
  definition?: CentralizedGuardrailDefinition;
  isConfigMissing: boolean;
  /** Localized scope names, already resolved and ordered. */
  scopeNames: string[];
  labels: CentralizedGuardrailsLabels;
  onSelect?: () => void;
}

/**
 * One centralized guardrail, as a summary. Everything here is also in the details view; the
 * row's job is to be scannable, which is why a broken configuration gets a chip next to the
 * name as well as the sentence that says what to do about it.
 */
export function CentralizedGuardrailRow({
  guardrail,
  name,
  description,
  definition,
  isConfigMissing,
  scopeNames,
  labels,
  onSelect,
}: CentralizedGuardrailRowProps) {
  const isConfigDisabled = definition?.status === 'Disabled';
  const providerName = definition?.byoConnectorName;

  const content = (
    <>
      {/* The accessible name is the row's own text, not an `aria-label`: a label would
          override it and hide the description, the provider and — the reason this matters —
          the broken-configuration message from screen readers entirely. This span only adds
          what the visual affordance says, which is that the row opens something. */}
      {onSelect && (
        <span className="sr-only">{formatGuardrailFormMessage(labels.viewDetails, { name })}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium leading-none">{name}</span>
          <CentralizedGuardrailOriginChip isByo={guardrail.isByo} labels={labels} />
          {isConfigMissing && (
            <GuardrailStatusChip tone="error" className="shrink-0">
              {labels.statusMissingConfig}
            </GuardrailStatusChip>
          )}
          {isConfigDisabled && (
            <GuardrailStatusChip tone="error" className="shrink-0">
              {labels.statusDisabledConfig}
            </GuardrailStatusChip>
          )}
        </span>
        {isConfigMissing && (
          <span
            className="mt-1.5 block whitespace-normal break-words text-xs text-destructive"
            data-slot="centralized-guardrail-missing-config"
          >
            {labels.missingConfigMessage}
          </span>
        )}
        {isConfigDisabled && (
          <span
            className="mt-1.5 block whitespace-normal break-words text-xs text-destructive"
            data-slot="centralized-guardrail-disabled-config"
          >
            {labels.disabledConfigMessage}
          </span>
        )}
        {description && (
          <span className="mt-1.5 block truncate text-xs leading-none text-foreground-muted">
            {description}
          </span>
        )}
        {providerName !== undefined && (
          <span
            className="mt-1.5 block truncate text-xs leading-none text-foreground-muted"
            data-slot="centralized-guardrail-provider"
          >
            {labels.provider}: {providerName}
          </span>
        )}
        <span className="mt-1.5 block truncate text-xs leading-none text-foreground-muted">
          {labels.scopes}: {scopeNames.join(', ')} · {labels.executionStage}:{' '}
          {formatCentralizedExecutionStage(guardrail.executionStage, labels)}
        </span>
      </span>
      {onSelect && <ChevronRight className="size-4 shrink-0 text-foreground-muted" />}
    </>
  );

  const className = cn(
    'flex w-full items-start gap-2 rounded-md px-1 py-1.5 text-left',
    onSelect &&
      'cursor-pointer transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  );

  // A row with nowhere to go is not a control. Both products render a disabled button there,
  // which takes it out of the tab order anyway and announces it as unavailable rather than as
  // the plain text it actually is.
  if (!onSelect) {
    return (
      <div data-slot="centralized-guardrail-row" className={className}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-slot="centralized-guardrail-row"
      className={className}
      onClick={onSelect}
    >
      {content}
    </button>
  );
}
