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
 * One centralized guardrail, styled like `GuardrailListRow`. With `onSelect` the whole row is
 * a `<button>`, so everything inside it is a `span`.
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
      {/* Named by its own text: an `aria-label` would hide the rest of the row. */}
      {onSelect && (
        <span className="sr-only">{formatGuardrailFormMessage(labels.viewDetails, { name })}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          <CentralizedGuardrailOriginChip isByo={guardrail.isByo} labels={labels} />
          {isConfigMissing && (
            <GuardrailStatusChip tone="error" className="shrink-0">
              {labels.statusUnavailable}
            </GuardrailStatusChip>
          )}
          {isConfigDisabled && (
            <GuardrailStatusChip tone="error" className="shrink-0">
              {labels.statusDisabled}
            </GuardrailStatusChip>
          )}
        </span>
        {isConfigMissing && (
          <span
            className="block whitespace-normal break-words text-xs text-error"
            data-slot="centralized-guardrail-missing-config"
          >
            {labels.missingConfigMessage}
          </span>
        )}
        {isConfigDisabled && (
          <span
            className="block whitespace-normal break-words text-xs text-error"
            data-slot="centralized-guardrail-disabled-config"
          >
            {labels.disabledConfigMessage}
          </span>
        )}
        {description && (
          <span className="block truncate text-xs text-muted-foreground">{description}</span>
        )}
        {providerName !== undefined && (
          <span
            className="block truncate text-xs text-muted-foreground"
            data-slot="centralized-guardrail-provider"
          >
            {labels.provider}: {providerName}
          </span>
        )}
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {labels.scopes}: {scopeNames.join(', ')} · {labels.executionStage}:{' '}
          {formatCentralizedExecutionStage(guardrail.executionStage, labels)}
        </span>
      </span>
      {onSelect && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
    </>
  );

  const className = cn(
    // `-mx-1` as on `GuardrailListRow`; a button shrinks to fit, so the width is explicit.
    '-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-2 rounded-md p-1 text-left',
    onSelect &&
      'cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  );

  // Plain text, not a disabled button, when there is nowhere to go.
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
