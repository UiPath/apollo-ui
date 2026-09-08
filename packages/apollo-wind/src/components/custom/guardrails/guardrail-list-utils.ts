import { arrayMove } from '@dnd-kit/sortable';
import type { GuardrailDefinition } from './builder-types';
import type {
  GuardrailListItem,
  GuardrailListItemState,
  GuardrailListMove,
  GuardrailListOrigin,
} from './list-types';

/**
 * Pure derivations behind the guardrail list section. Everything here used to live twice: the
 * definition lookup and the BYO broken/disabled predicates are byte-for-byte equivalent in
 * Agents (`ToolGuardrailPolicyBuilder.utils.tsx`) and Flow (`guardrail-utils.ts`), which is
 * why they can be lifted without picking a winner.
 */

/**
 * A definition as the list reads it: the display-ready shape plus the connector name that
 * only enrichment supplies. Written as an intersection rather than
 * `EnrichedGuardrailDefinition` so a host holding plain `GuardrailDefinition`s still fits.
 */
export type GuardrailListDefinition = GuardrailDefinition & { byoConnectorName?: string };

/** `$guardrailType` of the records that resolve against the definitions catalog. */
const BUILT_IN_VALIDATOR_TYPE = 'builtInValidator';

/**
 * Whether a definition describes a guardrail. BYO validator names are unique per tenant, so
 * the name alone identifies the configuration and an admin rebinding it to another connection
 * still resolves; built-ins match on `validator` and must not match a BYO definition that
 * happens to declare the same validator id.
 */
export function matchGuardrailDefinition(
  definition: GuardrailListDefinition,
  guardrail: GuardrailListItem
): boolean {
  return guardrail.byoValidatorName === undefined
    ? definition.byoValidatorName === undefined && definition.validator === guardrail.validatorType
    : definition.byoValidatorName === guardrail.byoValidatorName;
}

/**
 * Non-throwing lookup: `undefined` when the definition is missing (a removed BYO
 * configuration, or a validator the tenant cannot see) so callers can render a broken state.
 */
export function findGuardrailDefinition<T extends GuardrailListDefinition>(
  guardrail: GuardrailListItem,
  definitions: readonly T[] | undefined
): T | undefined {
  if (guardrail.$guardrailType !== BUILT_IN_VALIDATOR_TYPE) return undefined;
  return definitions?.find((definition) => matchGuardrailDefinition(definition, guardrail));
}

/**
 * Row identity. Flow persists an `id`; Agents does not and keys by the (unique) `name`.
 * Falling back rather than requiring one lets both hosts pass their records unmapped.
 */
export function defaultGuardrailItemId(guardrail: GuardrailListItem): string {
  return guardrail.id ?? guardrail.name;
}

/**
 * Everything a row renders about a guardrail's health and provenance.
 *
 * The `definitions.length > 0` guard on the unavailable case is load-order protection, not
 * defensiveness: without it every BYO row flashes "no longer available" while the catalog is
 * still in flight. Both products already carry it.
 */
export function resolveGuardrailListItemState(
  guardrail: GuardrailListItem,
  definitions: readonly GuardrailListDefinition[] = [],
  origin: GuardrailListOrigin = 'local'
): GuardrailListItemState {
  if (guardrail.$guardrailType !== BUILT_IN_VALIDATOR_TYPE) {
    return { status: 'Available', origin };
  }

  const definition = findGuardrailDefinition(guardrail, definitions);
  const isByo = guardrail.byoValidatorName !== undefined;

  if (!definition) {
    return isByo && definitions.length > 0
      ? { status: 'Unavailable', origin, notice: 'byoUnavailable' }
      : { status: 'Available', origin };
  }

  const state: GuardrailListItemState = { status: definition.status, origin };
  if (definition.byoConnectorName !== undefined) {
    state.byoConnectorName = definition.byoConnectorName;
  }
  // Only BYO rows explain a disabled definition inline: a disabled built-in is a tenant-wide
  // condition the row cannot act on, so it gets the chip and nothing more.
  if (isByo && definition.status === 'Disabled') state.notice = 'byoDisabled';
  return state;
}

/**
 * Apply a drag or keyboard reorder. Returns `null` for a no-op (same position, or an id the
 * list does not hold) so callers can skip the write entirely rather than persist an identical
 * array.
 */
export function moveGuardrail<T>(
  guardrails: readonly T[],
  activeId: string,
  overId: string,
  getItemId: (guardrail: T) => string
): { guardrails: T[]; move: GuardrailListMove } | null {
  const from = guardrails.findIndex((guardrail) => getItemId(guardrail) === activeId);
  const to = guardrails.findIndex((guardrail) => getItemId(guardrail) === overId);
  if (from === -1 || to === -1 || from === to) return null;
  return { guardrails: arrayMove([...guardrails], from, to), move: { from, to, id: activeId } };
}
