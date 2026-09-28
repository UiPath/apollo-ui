import type { GuardrailAction, GuardrailBuilderErrors, GuardrailSelector } from './builder-types';
import type { GuardrailFieldReference, GuardrailRule, GuardrailRulesErrors } from './rules-types';

/**
 * Structural mirrors of the custom guardrail both products persist, so a host maps nothing;
 * mutual assignability is asserted host-side.
 */

/**
 * `GuardrailAction` with the filter arm's fields typed. This builder edits them, so they are the
 * field references rules use rather than the opaque pass-through the built-in builder carries.
 */
export type CustomGuardrailAction =
  | Exclude<GuardrailAction, { $actionType: 'filter' }>
  | { $actionType: 'filter'; fields: GuardrailFieldReference[] };

/** The custom builder's in/out value: mirrors the persisted custom guardrail shape. */
export interface CustomGuardrailBuilderValue {
  id: string;
  $guardrailType: 'custom';
  name: string;
  description?: string;
  selector: GuardrailSelector;
  action: CustomGuardrailAction;
  enabledForEvals: boolean;
  rules: GuardrailRule[];
}

/**
 * Host-supplied validation errors, merged over the builder's internal validation (the host
 * message wins per field, and per rule field in `perRule`). Any present error gates Save.
 */
export type CustomGuardrailBuilderErrors = Pick<
  GuardrailBuilderErrors,
  'name' | 'blockReason' | 'filterFields' | 'recipient' | 'actionApp'
> &
  GuardrailRulesErrors;
