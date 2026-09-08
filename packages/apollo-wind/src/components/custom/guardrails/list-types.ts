import type { GuardrailDefinitionStatus, GuardrailSelector } from './builder-types';

/**
 * Structural mirror of the persisted guardrail record, narrowed to what the list section
 * reads. Hosts pass their own richer union unmapped: the list is generic over `T`, so every
 * callback hands back the exact object that went in.
 *
 * Deliberately not `GuardrailBuilderValue`: the list renders custom (rule-based) guardrails
 * next to built-in-validator ones, and custom records carry no `validatorType`.
 */
export interface GuardrailListItem {
  /** Flow keys rows by `id`; Agents has no id and keys by `name`. See `defaultGuardrailItemId`. */
  id?: string;
  name: string;
  description?: string;
  /** `'builtInValidator'` rows resolve against the definitions; every other value does not. */
  $guardrailType: string;
  validatorType?: string;
  byoValidatorName?: string;
  selector?: GuardrailSelector;
  action?: { $actionType: string };
}

/**
 * Where the guardrail is administered from. Not inferable from the record: both products
 * fetch governance-managed guardrails from a different endpoint, so the host tags them.
 */
export type GuardrailListOrigin = 'local' | 'governance';

/**
 * Row status. `'Unavailable'` extends the wire statuses with the client-side case both
 * products already detect: a BYO guardrail whose definition is gone from the catalog.
 */
export type GuardrailListItemStatus = GuardrailDefinitionStatus | 'Unavailable';

/** Which explanatory sentence, if any, the row prints under its title. */
export type GuardrailListItemNotice = 'byoDisabled' | 'byoUnavailable';

/** Everything the row derives from a guardrail plus the definitions catalog. */
export interface GuardrailListItemState {
  /**
   * `'Available'` is the quiet state and renders no chip. It also covers rows there is
   * nothing to report on: custom guardrails, and built-ins whose definition has not loaded.
   */
  status: GuardrailListItemStatus;
  origin: GuardrailListOrigin;
  /** Connector that supplies a BYO guardrail, shown as the row's provider line. */
  byoConnectorName?: string;
  notice?: GuardrailListItemNotice;
}

/** Context handed to the `renderItemActions` slot (e.g. an overflow menu instead of buttons). */
export interface GuardrailListItemActionsContext<T extends GuardrailListItem = GuardrailListItem> {
  guardrail: T;
  state: GuardrailListItemState;
  /** True when the whole list is read-only; render your actions disabled. */
  disabled: boolean;
  /** Routes through the list's `onEdit`; a no-op when the host passed none. */
  edit: () => void;
  /** Routes through the list's `onRemove`; a no-op when the host passed none. */
  remove: () => void;
}

/** The move a drag or keyboard reorder produced, reported alongside the reordered array. */
export interface GuardrailListMove {
  from: number;
  to: number;
  /** Id of the guardrail that moved, per the list's `getItemId`. */
  id: string;
}
