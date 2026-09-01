import {
  type GuardrailAction,
  type GuardrailBuilderValue,
  type GuardrailDefinition,
  GuardrailRecipientType,
  type GuardrailScope,
  type GuardrailSelector,
} from './builder-types';
import { seedGuardrailParameters } from './utils';

export function generateGuardrailId(): string {
  return `guardrail-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Default action payload for a freshly selected action type. */
export function createDefaultGuardrailAction(
  type: GuardrailAction['$actionType']
): GuardrailAction {
  switch (type) {
    case 'block':
      return { $actionType: 'block', reason: '' };
    case 'filter':
      return { $actionType: 'filter', fields: [] };
    case 'escalate':
      return {
        $actionType: 'escalate',
        app: { id: '', version: '', name: '' },
        recipient: { type: GuardrailRecipientType.User, value: '', displayName: '' },
      };
    default:
      return { $actionType: 'log', severityLevel: 'Info' };
  }
}

export type GuardrailActionErrorField = 'blockReason' | 'filterFields' | 'recipient' | 'actionApp';

/** Action fields whose current value fails required validation. Message text is caller-owned. */
export function getGuardrailActionErrorFields(
  action: GuardrailAction
): GuardrailActionErrorField[] {
  const fields: GuardrailActionErrorField[] = [];
  switch (action.$actionType) {
    case 'block':
      if (!action.reason.trim()) fields.push('blockReason');
      break;
    case 'filter':
      if (action.fields.length === 0) fields.push('filterFields');
      break;
    case 'escalate': {
      if (!('value' in action.recipient) || !action.recipient.value.trim())
        fields.push('recipient');
      if (!action.app.id) fields.push('actionApp');
      break;
    }
  }
  return fields;
}

export type GuardrailSelectorErrorField = 'scopes' | 'toolNames';

/**
 * Selector fields whose current value fails required validation. Unconditional — callers
 * gate on whether the scope selector is shown at all.
 */
export function getGuardrailSelectorErrorFields(
  selector: GuardrailSelector
): GuardrailSelectorErrorField[] {
  const fields: GuardrailSelectorErrorField[] = [];
  if (selector.scopes.length === 0) fields.push('scopes');
  if (
    selector.scopes.includes('Tool') &&
    (!selector.matchNames || selector.matchNames.length === 0)
  ) {
    fields.push('toolNames');
  }
  return fields;
}

export interface GuardrailBuilderFormData {
  id: string;
  name: string;
  description: string;
  selector: GuardrailSelector;
  action: GuardrailAction;
  enabledForEvals: boolean;
  validatorParameters: GuardrailBuilderValue['validatorParameters'];
}

/**
 * Initial form state: an existing guardrail is copied verbatim (edit); otherwise values are
 * seeded from the definition — parameters via `seedGuardrailParameters`, the scope coerced to
 * the definition's first allowed scope when `Agent` is not allowed, a log/Info default
 * action, and evaluations enabled.
 *
 * @internal Exported for testing only
 */
export function initGuardrailBuilderFormData(
  definition: GuardrailDefinition,
  scope: GuardrailScope,
  existing?: GuardrailBuilderValue,
  toolName?: string
): GuardrailBuilderFormData {
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      description: existing.description ?? '',
      selector: existing.selector,
      action: existing.action,
      enabledForEvals: existing.enabledForEvals,
      validatorParameters: existing.validatorParameters,
    };
  }

  const initialScope =
    scope === 'Agent'
      ? definition.allowedScopes.includes('Agent')
        ? 'Agent'
        : definition.allowedScopes[0]
      : scope;

  return {
    id: generateGuardrailId(),
    name: definition.displayName,
    description: '',
    selector: {
      scopes: [initialScope],
      ...(initialScope === 'Tool' && toolName ? { matchNames: [toolName] } : {}),
    },
    action: { $actionType: 'log', severityLevel: 'Info' },
    enabledForEvals: true,
    validatorParameters: seedGuardrailParameters(definition.parameters),
  };
}
