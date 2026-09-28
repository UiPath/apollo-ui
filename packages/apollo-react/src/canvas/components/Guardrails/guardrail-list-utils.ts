import type { GuardrailListLabels } from './i18n';
import type {
  GuardrailListAdministration,
  GuardrailListChip,
  GuardrailListDefinition,
  GuardrailListItem,
  GuardrailListItemState,
} from './list-types';

/**
 * A row's identity. Agents keys rows by `name`, unique per agent by construction, and Flow by
 * `id`, so one default covers both; override with `getItemId`.
 */
export function getGuardrailListItemId(item: GuardrailListItem): string {
  return item.id ?? item.name;
}

/**
 * Both products' own `matchesGuardrailDefinition`: a BYO guardrail matches on the validator
 * name alone, so rebinding a configuration to another connection still resolves.
 */
export function matchesGuardrailListDefinition(
  definition: GuardrailListDefinition,
  item: GuardrailListItem
): boolean {
  return item.byoValidatorName === undefined
    ? definition.byoValidatorName === undefined && definition.validator === item.validatorType
    : definition.byoValidatorName === item.byoValidatorName;
}

/**
 * Resolve one row against the host-filtered definitions. The BYO notices keep both products'
 * `definitions.length > 0` guard, without which every BYO row claims its configuration is
 * gone while the catalog is still in flight.
 */
export function resolveGuardrailListItemState(
  item: GuardrailListItem,
  definitions: readonly GuardrailListDefinition[] = []
): GuardrailListItemState {
  // Only built-in-validator guardrails carry this field in either product, so it is the test.
  const isByo = item.byoValidatorName !== undefined;
  const definition = definitions.find((candidate) =>
    matchesGuardrailListDefinition(candidate, item)
  );
  const byoUnavailable = isByo && definitions.length > 0 && definition === undefined;
  const byoDisabled = isByo && definition?.status === 'Disabled';

  return {
    definition,
    status: byoUnavailable ? 'Unavailable' : definition?.status,
    isByo,
    provider: definition?.byoConnectorName,
    byoDisabled,
    byoUnavailable,
  };
}

/**
 * At most one status and one administration chip. A locally administered `Available` row
 * produces none, which is the common case: both products chip nothing for it today.
 */
export function getGuardrailListChips(
  input: {
    status?: GuardrailListItemState['status'];
    administration?: GuardrailListAdministration;
  },
  labels: GuardrailListLabels
): GuardrailListChip[] {
  const chips: GuardrailListChip[] = [];

  const statusChip = ((): Omit<GuardrailListChip, 'id'> | undefined => {
    switch (input.status) {
      case 'FeatureDisabled':
        return { tone: 'warning', label: labels.statusFeatureDisabled };
      case 'Unauthorised':
        return { tone: 'warning', label: labels.statusUnauthorized };
      case 'Disabled':
        return { tone: 'error', label: labels.statusDisabled };
      case 'Unavailable':
        return { tone: 'error', label: labels.statusUnavailable };
      default:
        return undefined;
    }
  })();
  if (statusChip) chips.push({ id: 'status', ...statusChip });

  if (input.administration === 'governance') {
    chips.push({ id: 'administration', tone: 'neutral', label: labels.administrationGovernance });
  }

  return chips;
}
