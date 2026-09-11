import type { ReactNode } from 'react';
import type { GuardrailDefinitionStatus, GuardrailSelector } from './builder-types';

/**
 * Structural mirrors for the guardrails list. Like `builder-types.ts`, these describe the
 * shapes both products already persist rather than introducing a package type hosts have to
 * map to; mutual assignability is asserted host-side.
 *
 * Where the list only reads one field of a larger shape it asks for that field alone
 * (`action` is `{ $actionType }`, not the full action union): the list renders a row, it never
 * interprets an action, so the narrower requirement is what keeps both products' unions and
 * their custom-guardrail members assignable.
 */

/**
 * One row. Covers both products' guardrail kinds: the built-in-validator shape the builder
 * edits, and the custom/deterministic shape only the list has to display.
 */
export interface GuardrailListItem {
  /** Stable id where the product has one (Flow). Rows fall back to `name` (Agents). */
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
 * The definition fields a row resolves against. A `GuardrailDefinition` (and the enriched
 * definitions the definitions layer produces) satisfies this, so hosts pass the array they
 * already have, filtered by their own flags and entitlements.
 */
export interface GuardrailListDefinition {
  validator: string;
  status: GuardrailDefinitionStatus;
  byoValidatorName?: string;
  /** BYO connector display name, rendered as the row's provider line. */
  byoConnectorName?: string;
}

/**
 * Who administers a row: the agent's own configuration, or a tenant governance policy.
 *
 * Deliberately not called "origin": both products already use that word for BYO versus
 * UiPath-managed validators (`GuardrailOriginChip`, `CentralizedGuardrailOriginBadge`), which
 * is a different axis and is carried here by `byoValidatorName`.
 */
export type GuardrailListAdministration = 'local' | 'governance';

/**
 * A row's resolved status. `'Unavailable'` is not a wire status: it is what a BYO row shows
 * once its definition has stopped resolving.
 */
export type GuardrailListStatus = GuardrailDefinitionStatus | 'Unavailable';

/** What resolving a row against the definitions told us about it. */
export interface GuardrailListItemState {
  /** The matched definition, if any. */
  definition?: GuardrailListDefinition;
  /** Chip-worthy status, `undefined` when nothing resolved (a custom guardrail, say). */
  status?: GuardrailListStatus;
  isByo: boolean;
  /** BYO connector name, from the matched definition. */
  provider?: string;
  /** The BYO configuration exists but has been disabled: blocking notice on the row. */
  byoDisabled: boolean;
  /** The BYO configuration no longer resolves: blocking notice on the row. */
  byoUnavailable: boolean;
}

/** One resolved chip. `tone` maps onto the wind `Badge` variants the chip uses. */
export interface GuardrailListChip {
  /** Which axis produced it, and the React key. */
  id: 'status' | 'administration';
  tone: 'neutral' | 'warning' | 'error';
  label: string;
}

/** Where a row moved to, alongside the reordered array. */
export interface GuardrailReorderMove {
  from: number;
  to: number;
  /** The moved row's id, as `getItemId` resolved it. */
  id: string;
}

/**
 * Hover (and keyboard-focus) content for a row body. Return nothing to leave that row
 * untooltipped, which is what lets a host tooltip some rows and not others.
 *
 * Declared here rather than inferred from the row's props so both `GuardrailListProps` and
 * `GuardrailListRowProps` name the same type and autodocs show a signature.
 */
export type GuardrailRowTooltipRenderer = (item: GuardrailListItem) => ReactNode;

/** Context handed to the `renderItemActions` slot (Agents' overflow menu). */
export interface GuardrailListItemActionsContext {
  item: GuardrailListItem;
  /** The row's resolved id. */
  id: string;
  /** Row index in the rendered (visible) list. */
  index: number;
  /** Whether the list is read-only. */
  disabled: boolean;
  /**
   * The list's intents, already bound to this row. Absent when the host passed no handler
   * *or* the list is disabled, so a slot can render its own control without re-checking
   * `disabled`.
   */
  onEdit?: () => void;
  onRemove?: () => void;
  /** The default inline Edit / Remove buttons, so a slot can add to them instead of replacing. */
  defaultActions: ReactNode;
}
