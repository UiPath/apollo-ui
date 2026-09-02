import type { ReactNode } from 'react';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label, RequiredIndicator } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  GuardrailAction,
  GuardrailAppPickerContext,
  GuardrailRecipientSearchContext,
} from '../builder-types';
import { createDefaultGuardrailAction } from '../builder-utils';
import type { GuardrailBuilderLabels } from '../i18n';
import { EscalateActionFields } from './escalate-action-fields';

export interface GuardrailActionSectionProps {
  action: GuardrailAction;
  onActionChange: (action: GuardrailAction) => void;
  /** Whether to include 'filter' as an option (custom guardrails only) */
  showFilter?: boolean;
  /** Content rendered as the second grid column when $actionType === 'filter' */
  filterContent?: ReactNode;
  errors?: { blockReason?: string; filterFields?: string; recipient?: string; actionApp?: string };
  labels: GuardrailBuilderLabels;
  renderRecipientSearch?: (ctx: GuardrailRecipientSearchContext) => ReactNode;
  renderAppPicker?: (ctx: GuardrailAppPickerContext) => ReactNode;
  escalateHelp?: ReactNode;
}

/**
 * Action section of the guardrail builder: a 2-column grid of action-type select + the
 * type-dependent secondary field. Switching the type resets the action payload. Escalate
 * expands into the full escalation layout.
 */
export function GuardrailActionSection({
  action,
  onActionChange,
  showFilter = false,
  filterContent,
  errors,
  labels,
  renderRecipientSearch,
  renderAppPicker,
  escalateHelp,
}: GuardrailActionSectionProps) {
  const actionTypeSelect = (
    <FormField>
      <Label htmlFor="action-type">
        {labels.actionTypeLabel}
        <RequiredIndicator />
      </Label>
      <Select
        value={action.$actionType}
        onValueChange={(type) =>
          onActionChange(createDefaultGuardrailAction(type as GuardrailAction['$actionType']))
        }
      >
        <SelectTrigger id="action-type">
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
      <EscalateActionFields
        action={action}
        onChange={onActionChange}
        actionTypeSelect={actionTypeSelect}
        errors={errors}
        labels={labels}
        renderRecipientSearch={renderRecipientSearch}
        renderAppPicker={renderAppPicker}
        escalateHelp={escalateHelp}
      />
    );
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
        {actionTypeSelect}

        {action.$actionType === 'log' && (
          <FormField>
            <Label htmlFor="severity-level">
              {labels.severityLabel}
              <RequiredIndicator />
            </Label>
            <Select
              value={action.severityLevel}
              onValueChange={(v) =>
                onActionChange({ ...action, severityLevel: v } as GuardrailAction)
              }
            >
              <SelectTrigger id="severity-level">
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
            <Label htmlFor="block-reason">
              {labels.blockReasonLabel}
              <RequiredIndicator />
            </Label>
            <Input
              id="block-reason"
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
