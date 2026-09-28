import type { GuardrailSelector } from './builder-types';
import {
  type GuardrailActionErrorField,
  generateGuardrailId,
  getGuardrailActionErrorFields,
} from './builder-utils';
import type { CustomGuardrailAction, CustomGuardrailBuilderValue } from './custom-builder-types';
import type { GuardrailRule } from './rules-types';
import {
  createGuardrailRule,
  type GuardrailRuleErrorField,
  type GuardrailRulesErrorField,
  getGuardrailRuleErrorFields,
  getGuardrailRulesErrorFields,
} from './rules-utils';

/**
 * A new custom guardrail as both products start one: always enforced before and after the tool,
 * a log/Info action, evaluations on, targeting `toolName`. The name is left empty for the host's
 * unique default.
 */
export function createDefaultCustomGuardrail(toolName?: string): CustomGuardrailBuilderValue {
  return {
    id: generateGuardrailId(),
    $guardrailType: 'custom',
    name: '',
    selector: { scopes: ['Tool'], ...(toolName ? { matchNames: [toolName] } : {}) },
    action: { $actionType: 'log', severityLevel: 'Info' },
    enabledForEvals: true,
    rules: [createGuardrailRule('always')],
  };
}

/** `required`: the name is blank. `duplicate`: another guardrail has it, ignoring case. */
export type CustomGuardrailNameErrorField = 'required' | 'duplicate';

export interface CustomGuardrailErrorFields {
  name?: CustomGuardrailNameErrorField;
  /** Section-level rule failures, as `getGuardrailRulesErrorFields` reports them. */
  rules: GuardrailRulesErrorField[];
  /** Each rule's failing fields, aligned with `rules` by index. */
  perRule: GuardrailRuleErrorField[][];
  action: GuardrailActionErrorField[];
}

/** Which parts of a custom guardrail fail validation. Message text is caller-owned. */
export function getCustomGuardrailErrorFields(
  guardrail: Pick<CustomGuardrailBuilderValue, 'name' | 'rules' | 'action'>,
  existingNames?: readonly string[]
): CustomGuardrailErrorFields {
  const name = guardrail.name.trim();
  return {
    name: !name
      ? 'required'
      : existingNames?.some((n) => n.toLowerCase() === name.toLowerCase())
        ? 'duplicate'
        : undefined,
    rules: getGuardrailRulesErrorFields(guardrail.rules),
    perRule: guardrail.rules.map(getGuardrailRuleErrorFields),
    action: getGuardrailActionErrorFields(guardrail.action),
  };
}

export interface CustomGuardrailBuilderFormData {
  id: string;
  name: string;
  description: string;
  selector: GuardrailSelector;
  action: CustomGuardrailAction;
  enabledForEvals: boolean;
  rules: GuardrailRule[];
}

/**
 * Initial form state: an existing guardrail is copied verbatim (edit), selector included, since
 * this screen has no scope selector to change it; otherwise `createDefaultCustomGuardrail`.
 *
 * @internal Exported for testing only
 */
export function initCustomGuardrailBuilderFormData(
  existing?: CustomGuardrailBuilderValue,
  toolName?: string
): CustomGuardrailBuilderFormData {
  const source = existing ?? createDefaultCustomGuardrail(toolName);
  return {
    id: source.id,
    name: source.name,
    description: source.description ?? '',
    selector: source.selector,
    action: source.action,
    enabledForEvals: source.enabledForEvals,
    rules: source.rules,
  };
}
