import type { ReactNode } from 'react';
import type { GuardrailDefinitionStatus, GuardrailSelector } from './builder-types';

/**
 * Structural mirrors of the shapes both products already persist, so a host maps nothing;
 * mutual assignability is asserted host-side. Where the list reads one field of a larger
 * shape it asks for that field alone, which is what keeps both products' unions and their
 * custom-guardrail members assignable.
 */

/** One row, covering both products' guardrail kinds. */
export interface GuardrailListItem {
  /** Stable id where the product has one (Flow); rows fall back to `name` (Agents). */
  id?: string;
  name: string;
  description?: string;
  selector?: GuardrailSelector;
  /** Only the discriminator is read, for the action badge. */
  action?: { $actionType: string };
  /** Widened to `string`: the list branches on `'builtInValidator'` and ignores the rest. */
  $guardrailType?: string;
  validatorType?: string;
  /** Present on bring-your-own rows; it is what resolves them to a definition. */
  byoValidatorName?: string;
}

/**
 * The definition fields a row resolves against. `GuardrailDefinition` and the definitions
 * layer's enriched output both satisfy it, so a host passes the array it already has.
 */
export interface GuardrailListDefinition {
  validator: string;
  status: GuardrailDefinitionStatus;
  byoValidatorName?: string;
  /** Rendered as the row's provider line. */
  byoConnectorName?: string;
}

/**
 * Who administers a row: the agent's own configuration, or a tenant governance policy. Not
 * "origin", which both products already use for BYO versus UiPath-managed, a different axis
 * carried here by `byoValidatorName`.
 */
export type GuardrailListAdministration = 'local' | 'governance';

/** `'Unavailable'` is not a wire status: a BYO row whose definition stopped resolving. */
export type GuardrailListStatus = GuardrailDefinitionStatus | 'Unavailable';

/** What resolving a row against the definitions told us about it. */
export interface GuardrailListItemState {
  definition?: GuardrailListDefinition;
  /** `undefined` when nothing resolved, as for a custom guardrail. */
  status?: GuardrailListStatus;
  isByo: boolean;
  provider?: string;
  /** The configuration exists but is disabled. Both render a blocking notice on the row. */
  byoDisabled: boolean;
  byoUnavailable: boolean;
}

/** One resolved chip; `id` is also the React key. */
export interface GuardrailListChip {
  id: 'status' | 'administration';
  tone: 'neutral' | 'warning' | 'error';
  label: string;
}

/** Where a row moved to, alongside the reordered array. */
export interface GuardrailReorderMove {
  from: number;
  to: number;
  /** As `getItemId` resolved it. */
  id: string;
}

/**
 * Hover and keyboard-focus content for a row body. Return nothing to leave that row
 * untooltipped, which is what lets a host tooltip some rows and not others.
 */
export type GuardrailRowTooltipRenderer = (item: GuardrailListItem) => ReactNode;

/** Context handed to the `renderItemActions` slot (Agents' overflow menu). */
export interface GuardrailListItemActionsContext {
  item: GuardrailListItem;
  id: string;
  /** Index in the rendered (visible) list. */
  index: number;
  disabled: boolean;
  /**
   * Bound to this row, and absent when the host passed no handler *or* the list is disabled,
   * so a slot can render its own control without re-checking `disabled`.
   */
  onEdit?: () => void;
  onRemove?: () => void;
  /** So a slot can add to the inline Edit / Remove buttons instead of replacing them. */
  defaultActions: ReactNode;
}
