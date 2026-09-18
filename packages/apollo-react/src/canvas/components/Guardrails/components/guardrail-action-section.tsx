import {
  cn,
  FormField,
  FormFieldError,
  Input,
  Label,
  RequiredIndicator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uipath/apollo-wind';
import { type ReactNode, useId } from 'react';
import type {
  GuardrailAction,
  GuardrailActionErrors,
  GuardrailAppPickerContext,
  GuardrailRecipientSearchContext,
  GuardrailStaticRecipientContext,
} from '../builder-types';
import { createDefaultGuardrailAction } from '../builder-utils';
import { type GuardrailActionLabels, useGuardrailActionLabels } from '../i18n';
import { EscalateActionFields } from './escalate-action-fields';

export interface GuardrailActionSectionProps {
  action: GuardrailAction;
  /** Receives the whole next action; switching the type resets the payload. */
  onActionChange: (action: GuardrailAction) => void;
  /** Whether to include 'filter' as an option (custom guardrails only) */
  showFilter?: boolean;
  /** Content rendered as the second grid column when $actionType === 'filter' */
  filterContent?: ReactNode;
  /** Validation messages; each renders as soon as it is present. */
  errors?: GuardrailActionErrors;
  /** Per-string overrides; anything omitted resolves from the canvas lingui catalog. */
  labels?: Partial<GuardrailActionLabels>;
  renderRecipientSearch?: (ctx: GuardrailRecipientSearchContext) => ReactNode;
  /**
   * Replace the editor for static/asset recipients (types 3/4/5/6). Return `undefined` to
   * fall through to the built-in plain input.
   */
  renderStaticRecipient?: (ctx: GuardrailStaticRecipientContext) => ReactNode | undefined;
  renderAppPicker?: (ctx: GuardrailAppPickerContext) => ReactNode;
  /** Rendered under the escalation grid (e.g. a marketplace help line). */
  escalateHelp?: ReactNode;
  className?: string;
}

/**
 * Action section of the guardrail builder: a 2-column grid of action-type select + the
 * type-dependent secondary field. Switching the type resets the action payload. Escalate
 * expands into the full escalation layout (`EscalateActionFields`).
 *
 * Rendered inside `GuardrailBuilder`, and usable on its own with `action` and `onActionChange`
 * alone: labels come from the catalog and every slot has a fallback.
 */
export function GuardrailActionSection({
  action,
  onActionChange,
  showFilter = false,
  filterContent,
  errors,
  labels: labelOverrides,
  renderRecipientSearch,
  renderStaticRecipient,
  renderAppPicker,
  escalateHelp,
  className,
}: GuardrailActionSectionProps) {
  const labels = useGuardrailActionLabels(labelOverrides);
  // Namespaced per instance — two builders can share a document (inline panels).
  const uid = useId();

  const actionTypeSelect = (
    <FormField>
      <Label htmlFor={`${uid}-action-type`}>
        {labels.actionTypeLabel}
        <RequiredIndicator />
      </Label>
      <Select
        value={action.$actionType}
        onValueChange={(type) =>
          onActionChange(createDefaultGuardrailAction(type as GuardrailAction['$actionType']))
        }
      >
        <SelectTrigger id={`${uid}-action-type`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="log">{labels.actionLogLabel}</SelectItem>
          <SelectItem value="block">{labels.actionBlockLabel}</SelectItem>
          {showFilter && <SelectItem value="filter">{labels.actionFilterLabel}</SelectItem>}
          <SelectItem value="escalate">{labels.actionEscalateLabel}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  );

  if (action.$actionType === 'escalate') {
    return (
      <div data-slot="guardrail-action-section" className={className}>
        <EscalateActionFields
          action={action}
          onChange={onActionChange}
          actionTypeSelect={actionTypeSelect}
          errors={errors}
          labels={labels}
          renderRecipientSearch={renderRecipientSearch}
          renderStaticRecipient={renderStaticRecipient}
          renderAppPicker={renderAppPicker}
          escalateHelp={escalateHelp}
        />
      </div>
    );
  }

  return (
    <div data-slot="guardrail-action-section" className={cn('@container', className)}>
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
        {actionTypeSelect}

        {action.$actionType === 'log' && (
          <FormField>
            <Label htmlFor={`${uid}-severity-level`}>
              {labels.severityLabel}
              <RequiredIndicator />
            </Label>
            <Select
              value={action.severityLevel}
              onValueChange={(v) =>
                onActionChange({ ...action, severityLevel: v } as GuardrailAction)
              }
            >
              <SelectTrigger id={`${uid}-severity-level`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Info">{labels.severityInfoLabel}</SelectItem>
                <SelectItem value="Warning">{labels.severityWarningLabel}</SelectItem>
                <SelectItem value="Error">{labels.severityErrorLabel}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        )}

        {action.$actionType === 'block' && (
          <FormField>
            <Label htmlFor={`${uid}-block-reason`}>
              {labels.blockReasonLabel}
              <RequiredIndicator />
            </Label>
            <Input
              id={`${uid}-block-reason`}
              value={action.reason}
              onChange={(e) =>
                onActionChange({ ...action, reason: e.target.value } as GuardrailAction)
              }
              placeholder={labels.blockReasonPlaceholder}
              error={errors?.blockReason}
            />
          </FormField>
        )}

        {action.$actionType === 'filter' && (
          <FormField>
            {filterContent}
            <FormFieldError>{errors?.filterFields}</FormFieldError>
          </FormField>
        )}
      </div>
    </div>
  );
}
