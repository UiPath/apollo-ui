import {
  type GuardrailAction,
  type GuardrailBuilderValue,
  type GuardrailDefinition,
  GuardrailRecipientType,
  type GuardrailScope,
  type GuardrailSelector,
} from './builder-types';
import { normalizeGuardrailParameters, seedGuardrailParameters } from './utils';

const MODELLED_RECIPIENT_TYPES: ReadonlySet<number> = new Set(
  Object.values(GuardrailRecipientType)
);

/**
 * Whether a recipient's type is one `GuardrailEscalateRecipient` models (1-6). Any other type
 * is a host's own, carried through unchanged.
 *
 * @internal
 */
export function isModelledGuardrailRecipientType(type: number): boolean {
  return MODELLED_RECIPIENT_TYPES.has(type);
}

/**
 * A new guardrail's id: an RFC 4122 v4 UUID, because hosts such as Agents parse a tool guardrail
 * policy id as a GUID (AL-672). `crypto.randomUUID` exists only in secure contexts, so elsewhere
 * the UUID is built from `crypto.getRandomValues`.
 */
export function generateGuardrailId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // Version (4) and variant (10xx) bits.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return hex.replace(/^(.{8})(.{4})(.{4})(.{4})/, '$1-$2-$3-$4-');
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
      const recipient = action.recipient;
      // A type this package does not model is saved as stored, so it is the host's to validate.
      const filled =
        !isModelledGuardrailRecipientType(recipient.type) ||
        ('value' in recipient
          ? recipient.value.trim().length > 0
          : recipient.assetName.trim().length > 0);
      if (!filled) fields.push('recipient');
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
      // Normalised, not copied verbatim: this is the only path that receives persisted wire
      // data, and a malformed value (a `text-list` of `null`, say) otherwise reached the
      // builder's `guardrailResult` memo and threw during render, so the builder never mounted.
      // Doing it here rather than at the crash site also fixes `getRequiredEmptyParameterIds`,
      // which counted a null list as filled and let it past the Save gate.
      validatorParameters: normalizeGuardrailParameters(
        existing.validatorParameters,
        definition.parameters
      ),
    };
  }

  // Coerce for every opening scope, not just Agent: hosts filter definitions by allowedScopes
  // before opening the builder, but a definition that doesn't allow the opening scope must not
  // seed an invalid selector the user can't fix (the scope selector only renders for Agent).
  const initialScope = definition.allowedScopes.includes(scope)
    ? scope
    : (definition.allowedScopes[0] ?? scope);

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
