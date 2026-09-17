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
 * One centralized guardrail, as a summary. Everything here is also in the details view, so
 * the row's job is to be scannable: a broken configuration gets a chip next to the name as
 * well as the sentence that says what to do about it.
 *
 * Typography, spacing and tokens match `GuardrailListRow`, since the two sections render one
 * above the other. Two differences follow from this row's whole body being one control: it
 * carries the hover box and the chevron, and every element inside it is a `span`, because
 * flow content in a `<button>` is invalid.
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
          override it and hide the description, the provider and the broken-configuration
          message. This span only adds what the chevron says visually. */}
      {onSelect && (
        <span className="sr-only">{formatGuardrailFormMessage(labels.viewDetails, { name })}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
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
        {/* `text-error`, not `text-destructive`: the two resolve differently in several
            theme blocks, and wind's `FormFieldError` uses `text-error`. */}
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
    'flex w-full items-center gap-2 rounded-md p-1 text-left',
    onSelect &&
      // `accent` is Apollo's hover surface (`--accent: var(--surface-hover)`), while `muted`
      // is `surface-overlay`, the panel this section sits on. Family rule in the README.
      'cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  );

  // A row with nowhere to go is not a control. A disabled button would leave the tab order
  // anyway and announce as unavailable rather than as the plain text it is.
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
