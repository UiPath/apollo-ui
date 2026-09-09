import type { GuardrailListLabels } from './i18n';
import type {
  GuardrailListAdministration,
  GuardrailListChip,
  GuardrailListDefinition,
  GuardrailListItem,
  GuardrailListItemState,
} from './list-types';

/**
 * Pure helpers behind `GuardrailList`. Exported because hosts need the same answers outside a
 * row (a remove dialog naming the provider, a section deciding whether to render at all), and
 * because this is where both products' duplicated logic converges.
 */

/**
 * A row's identity: the product's own id where it has one, else the name.
 *
 * Agents keys rows by `name` (unique per agent by construction) and Flow by `id`, so one
 * default covers both. Override with `getItemId` if a product grows a third answer.
 */
export function getGuardrailListItemId(item: GuardrailListItem): string {
  return item.id ?? item.name;
}

/**
 * Whether a definition is the one a row was configured from.
 *
 * Byte-for-byte the rule both products already ship (`matchesGuardrailDefinition`): a BYO
 * guardrail matches on the validator name alone, because those names are unique per tenant
 * and an admin rebinding a configuration to another connection must still resolve.
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
 * Resolve one row against the (host-filtered) definitions: which definition it came from, its
 * status, and whether its BYO configuration is disabled or gone.
 *
 * The two BYO notices keep both products' `definitions.length > 0` guard. Without it every BYO
 * row claims its configuration is gone while the catalog is still in flight.
 */
export function resolveGuardrailListItemState(
  item: GuardrailListItem,
  definitions: readonly GuardrailListDefinition[] = []
): GuardrailListItemState {
  // Only built-in-validator guardrails carry a BYO validator name in either product, so the
  // field alone is the test; no `$guardrailType` branch is needed.
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
 * The chips a row shows: at most one status and one administration chip.
 *
 * A locally administered, `Available` row produces none, which is the common case and keeps
 * the list quiet. `Available` is deliberately not chipped: "working as configured" is not
 * news, and both products render nothing for it today.
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
