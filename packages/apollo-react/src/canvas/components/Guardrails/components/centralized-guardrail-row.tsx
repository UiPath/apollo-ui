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
 *
 * Typography, spacing and tokens match `GuardrailListRow`: both sections render one above the
 * other in both products, so a row that is read-only should differ from an editable one in
 * what it offers, not in how it looks. The two differences are deliberate. This row's whole
 * body is one control (the list's affordances are a drag handle and per-row buttons instead),
 * so it carries the `p-1` hover box and the chevron; and every element is a `span`,
 * because flow content inside a `<button>` is invalid.
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
            `tailwind.consumer.css` theme blocks, and wind's `FormFieldError` and the list
            row's BYO notices both settled on `text-error` for error text. */}
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
        {/* The list row's metadata line sits on the same `mt-1` step, so the two stacks line
            up when a policy section and a guardrail list are open together. */}
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {labels.scopes}: {scopeNames.join(', ')} · {labels.executionStage}:{' '}
          {formatCentralizedExecutionStage(guardrail.executionStage, labels)}
        </span>
      </span>
      {onSelect && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );

  const className = cn(
    'flex w-full items-center gap-2 rounded-md p-1 text-left',
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
