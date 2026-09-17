import { Alert, AlertDescription, cn } from '@uipath/apollo-wind';
import { Info } from 'lucide-react';
import type { GuardrailScope } from './builder-types';
import {
  findCentralizedBuiltInDefinition,
  findCentralizedByoDefinition,
  formatCentralizedAction,
  formatCentralizedExecutionStage,
  formatCentralizedScope,
  getCentralizedGuardrailDisplay,
  isCentralizedGuardrailConfigMissing,
  resolveCentralizedGuardrailParameters,
} from './centralized-guardrail-utils';
import type {
  CentralizedGuardrail,
  CentralizedGuardrailActionType,
  CentralizedGuardrailDefinition,
} from './centralized-types';
import { CentralizedDetailField } from './components/centralized-detail-field';
import { CentralizedGuardrailOriginChip } from './components/centralized-guardrail-origin-chip';
import { CentralizedGuardrailParameters } from './components/centralized-guardrail-parameters';
import { GuardrailStatusBanner } from './components/guardrail-status-banner';
import { useGuardrailDefinitionCopy } from './definitions-copy';
import type { CentralizedGuardrailsLabels } from './i18n';
import { useCentralizedGuardrailsLabels } from './i18n';

export interface CentralizedGuardrailDetailsProps<
  TDefinition extends CentralizedGuardrailDefinition = CentralizedGuardrailDefinition,
> {
  guardrail: CentralizedGuardrail;
  /** Name of the AI Trust Layer policy enforcing it. */
  policyName: string;
  /** The same array the section receives; `undefined` while the catalog is loading. */
  definitions?: TDefinition[];
  /** Replace the localized scope names. Defaults to the family's own scope labels. */
  formatScope?: (scope: GuardrailScope) => string;
  /** Replace the localized action name. Defaults to the family's own action labels. */
  formatAction?: (action: CentralizedGuardrailActionType) => string;
  labels?: Partial<CentralizedGuardrailsLabels>;
  className?: string;
}

/**
 * Everything an organization's policy enforces for one centralized guardrail, read-only.
 *
 * The content, not a shell: one product opens it in a dialog and the other pushes it onto a
 * panel overlay, each with its own header and dismissal, so the chrome stays host-side.
 */
export function CentralizedGuardrailDetails<
  TDefinition extends CentralizedGuardrailDefinition = CentralizedGuardrailDefinition,
>({
  guardrail,
  policyName,
  definitions,
  formatScope,
  formatAction,
  labels: labelOverrides,
  className,
}: CentralizedGuardrailDetailsProps<TDefinition>) {
  const labels = useCentralizedGuardrailsLabels(labelOverrides);
  const copy = useGuardrailDefinitionCopy();

  const byoDefinition = findCentralizedByoDefinition(guardrail, definitions);
  const definition = guardrail.isByo
    ? byoDefinition
    : findCentralizedBuiltInDefinition(guardrail, definitions);
  const { name, description } = getCentralizedGuardrailDisplay(guardrail, {
    definition: byoDefinition,
    copy,
  });
  const isConfigMissing = isCentralizedGuardrailConfigMissing(guardrail, definitions);
  const isConfigDisabled = byoDefinition?.status === 'Disabled';

  const parameterRows = resolveCentralizedGuardrailParameters(guardrail, {
    definition,
    labels: {
      enabled: labels.parameterEnabled,
      disabled: labels.parameterDisabled,
      entities: labels.entitiesFallback,
      thresholds: labels.thresholdsFallback,
    },
  });

  return (
    <div data-slot="centralized-guardrail-details" className={cn('space-y-4', className)}>
      {/* `note` rather than the primitive's `alert`: a standing explanation of the view, not
          something that just happened. `mt-0` cancels the `AlertDescription` offset, which
          assumes an `AlertTitle` above it and otherwise drops the text below the icon. */}
      <Alert role="note">
        <Info />
        <AlertDescription className="mt-0">{labels.managedMessage}</AlertDescription>
      </Alert>

      {isConfigMissing && (
        <GuardrailStatusBanner tone="error" message={labels.missingConfigMessage} />
      )}
      {isConfigDisabled && (
        <GuardrailStatusBanner tone="error" message={labels.disabledConfigMessage} />
      )}

      <dl className="space-y-3">
        <CentralizedDetailField label={labels.guardrailType}>
          <span className="flex items-center gap-1.5">
            <span className="min-w-0 truncate text-foreground">{name}</span>
            <CentralizedGuardrailOriginChip isByo={guardrail.isByo} labels={labels} />
          </span>
        </CentralizedDetailField>
        <CentralizedDetailField label={labels.policyField}>{policyName}</CentralizedDetailField>
        {byoDefinition?.byoConnectorName !== undefined && (
          <CentralizedDetailField label={labels.provider}>
            {byoDefinition.byoConnectorName}
          </CentralizedDetailField>
        )}
        <CentralizedDetailField label={labels.description}>
          {description ?? labels.noDescription}
        </CentralizedDetailField>
        <CentralizedDetailField label={labels.executionStage}>
          {formatCentralizedExecutionStage(guardrail.executionStage, labels)}
        </CentralizedDetailField>
        <CentralizedDetailField label={labels.scopes}>
          {guardrail.scopes
            .map((scope) => formatScope?.(scope) ?? formatCentralizedScope(scope, labels))
            .join(', ')}
        </CentralizedDetailField>
        <CentralizedDetailField label={labels.action}>
          {formatAction?.(guardrail.action) ?? formatCentralizedAction(guardrail.action, labels)}
        </CentralizedDetailField>
      </dl>

      <CentralizedGuardrailParameters rows={parameterRows} heading={labels.configuration} />
    </div>
  );
}
