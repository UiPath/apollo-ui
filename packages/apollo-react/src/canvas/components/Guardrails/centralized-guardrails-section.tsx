import { Button, cn, HoverCard, HoverCardContent, HoverCardTrigger } from '@uipath/apollo-wind';
import { Info, ShieldCheck } from 'lucide-react';
import type * as React from 'react';
import type { GuardrailScope } from './builder-types';
import {
  findCentralizedByoDefinition,
  formatCentralizedScope,
  getCentralizedGuardrailDisplay,
  getCentralizedGuardrailItemId,
  isCentralizedGuardrailConfigMissing,
} from './centralized-guardrail-utils';
import type { CentralizedGuardrail, CentralizedGuardrailDefinition } from './centralized-types';
import { CentralizedGuardrailRow } from './components/centralized-guardrail-row';
import { useGuardrailDefinitionCopy } from './definitions-copy';
import type { CentralizedGuardrailsLabels } from './i18n';
import { useCentralizedGuardrailsLabels } from './i18n';

export interface CentralizedGuardrailsSectionProps<
  TDefinition extends CentralizedGuardrailDefinition = CentralizedGuardrailDefinition,
> {
  /**
   * The guardrails this policy enforces on the agent being edited, already filtered by
   * `getApplicableCentralizedGuardrails`.
   */
  guardrails: CentralizedGuardrail[];
  /** Name of the AI Trust Layer policy enforcing them; shown in the caption. */
  policyName: string;
  /**
   * The tenant's guardrail definitions, for BYO provider names, configuration status and
   * parameter labels. Leave `undefined` while the catalog is loading, so a row cannot claim a
   * configuration was deleted before anything has been fetched.
   */
  definitions?: TDefinition[];
  /** Opening the details is host orchestration (a dialog, a panel overlay). */
  onSelect?: (guardrail: CentralizedGuardrail) => void;
  /** Product documentation link, shown inside the info popover. Omitted, no link renders. */
  docsHref?: string;
  /** Replace the localized scope names. Defaults to the family's own scope labels. */
  formatScope?: (scope: GuardrailScope) => string;
  /** Rendered when there is nothing to show. Defaults to rendering nothing at all. */
  emptyState?: React.ReactNode;
  /** Drop the card's border and padding, for a host nesting this in its own section chrome. */
  unstyled?: boolean;
  /** Drop the heading, info popover and policy caption; the host supplies its own. */
  hideHeader?: boolean;
  labels?: Partial<CentralizedGuardrailsLabels>;
  className?: string;
}

/** Splits the caption around its `{{policyName}}` token so the name can be emphasized. */
function PolicyCaption({ template, policyName }: { template: string; policyName: string }) {
  const [before, after] = template.split('{{policyName}}');
  return (
    <p className="pl-6 text-xs text-muted-foreground" data-slot="centralized-guardrails-policy">
      {before}
      <em>{policyName}</em>
      {/* A translation that dropped the token still renders the name, after the text. */}
      {after}
    </p>
  );
}

/**
 * The read-only list of guardrails an organization's AI Trust Layer governance policy
 * enforces on an agent. Nothing here is editable, so the section shows what is enforced and
 * hands a selection back; `CentralizedGuardrailDetails` is the content behind a row.
 *
 * The policy and the definitions come in as props. Both products hold them in a context of
 * their own, so reading one here would tie the component to whichever host it was written in.
 */
export function CentralizedGuardrailsSection<
  TDefinition extends CentralizedGuardrailDefinition = CentralizedGuardrailDefinition,
>({
  guardrails,
  policyName,
  definitions,
  onSelect,
  docsHref,
  formatScope,
  emptyState,
  unstyled = false,
  hideHeader = false,
  labels: labelOverrides,
  className,
}: CentralizedGuardrailsSectionProps<TDefinition>) {
  const labels = useCentralizedGuardrailsLabels(labelOverrides);
  const copy = useGuardrailDefinitionCopy();

  if (guardrails.length === 0) {
    // An explicit `null` is honoured; rendering nothing is also the default.
    return emptyState === undefined ? null : <>{emptyState}</>;
  }

  return (
    <div
      data-slot="centralized-guardrails-section"
      className={cn(!unstyled && 'rounded-md border', className)}
    >
      {!hideHeader && (
        <div className={cn('space-y-0.5', !unstyled && 'px-3 py-2')}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium">{labels.title}</span>
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="3xs"
                  icon
                  className="size-5 text-muted-foreground"
                  aria-label={labels.info}
                >
                  <Info />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs space-y-2 text-left text-xs">
                <p>{labels.info}</p>
                {docsHref !== undefined && (
                  <a
                    href={docsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary hover:underline"
                  >
                    {labels.docsLink}
                  </a>
                )}
              </HoverCardContent>
            </HoverCard>
          </div>
          <PolicyCaption template={labels.policyCaption} policyName={policyName} />
        </div>
      )}

      <div className={cn('space-y-2', !unstyled && 'p-3')}>
        {guardrails.map((guardrail) => {
          const definition = findCentralizedByoDefinition(guardrail, definitions);
          const { name, description } = getCentralizedGuardrailDisplay(guardrail, {
            definition,
            copy,
          });
          return (
            <CentralizedGuardrailRow
              key={getCentralizedGuardrailItemId(guardrail)}
              guardrail={guardrail}
              name={name}
              description={description}
              definition={definition}
              isConfigMissing={isCentralizedGuardrailConfigMissing(guardrail, definitions)}
              scopeNames={guardrail.scopes.map(
                (scope) => formatScope?.(scope) ?? formatCentralizedScope(scope, labels)
              )}
              labels={labels}
              onSelect={onSelect === undefined ? undefined : () => onSelect(guardrail)}
            />
          );
        })}
      </div>
    </div>
  );
}
