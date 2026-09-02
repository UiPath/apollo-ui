import { Info } from 'lucide-react';
import { type ReactNode, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  type GuardrailAction,
  type GuardrailAppPickerContext,
  type GuardrailEscalateRecipient,
  type GuardrailRecipientSearchContext,
  GuardrailRecipientType,
} from '../builder-types';
import type { GuardrailBuilderLabels } from '../i18n';

type EscalateAction = Extract<GuardrailAction, { $actionType: 'escalate' }>;

export interface EscalateActionFieldsProps {
  action: EscalateAction;
  onChange: (action: EscalateAction) => void;
  /** Leading grid cell (the Action type select); this component owns the full escalate layout. */
  actionTypeSelect: ReactNode;
  errors?: { recipient?: string; actionApp?: string };
  labels: GuardrailBuilderLabels;
  renderRecipientSearch?: (ctx: GuardrailRecipientSearchContext) => ReactNode;
  renderAppPicker?: (ctx: GuardrailAppPickerContext) => ReactNode;
  /** Rendered under the escalation grid (e.g. a marketplace help line). */
  escalateHelp?: ReactNode;
}

/**
 * Escalation action fields: recipient type + recipient value + action-app picker. The
 * recipient autosuggest (User/Group) and the app picker are host capabilities injected via
 * render props; plain-input / unavailable-note fallbacks keep the form usable without them.
 */
export function EscalateActionFields({
  action,
  onChange,
  actionTypeSelect,
  errors,
  labels,
  renderRecipientSearch,
  renderAppPicker,
  escalateHelp,
}: EscalateActionFieldsProps) {
  const recipientTypeLabels: Record<number, string> = {
    [GuardrailRecipientType.User]: labels.recipientUserLabel,
    [GuardrailRecipientType.Group]: labels.recipientGroupLabel,
    [GuardrailRecipientType.StaticEmail]: labels.recipientEmailLabel,
    [GuardrailRecipientType.StaticGroupName]: labels.recipientGroupNameLabel,
  };

  const recipientType = action.recipient.type;

  const handleRecipientTypeChange = useCallback(
    (value: string) => {
      const newType = Number(value) as GuardrailEscalateRecipient['type'];
      let recipient: GuardrailEscalateRecipient;

      switch (newType) {
        case GuardrailRecipientType.Group:
          recipient = { type: GuardrailRecipientType.Group, value: '', displayName: '' };
          break;
        case GuardrailRecipientType.StaticEmail:
          recipient = { type: GuardrailRecipientType.StaticEmail, value: '' };
          break;
        case GuardrailRecipientType.StaticGroupName:
          recipient = { type: GuardrailRecipientType.StaticGroupName, value: '' };
          break;
        default:
          recipient = { type: GuardrailRecipientType.User, value: '', displayName: '' };
      }

      onChange({ ...action, recipient });
    },
    [action, onChange]
  );

  const handleRecipientSelect = useCallback(
    (selection: { value: string; displayName: string }) => {
      const r = action.recipient;
      if (r.type === GuardrailRecipientType.User || r.type === GuardrailRecipientType.Group) {
        onChange({
          ...action,
          recipient: { ...r, value: selection.value, displayName: selection.displayName },
        });
      }
    },
    [action, onChange]
  );

  const handleRecipientClear = useCallback(() => {
    const r = action.recipient;
    if (r.type === GuardrailRecipientType.User || r.type === GuardrailRecipientType.Group) {
      onChange({ ...action, recipient: { ...r, value: '', displayName: '' } });
    }
  }, [action, onChange]);

  const handleTextValueChange = useCallback(
    (value: string) => {
      const r = action.recipient;
      if (
        r.type === GuardrailRecipientType.StaticEmail ||
        r.type === GuardrailRecipientType.StaticGroupName
      ) {
        onChange({ ...action, recipient: { ...r, value } });
      }
    },
    [action, onChange]
  );

  const recipientValue = 'value' in action.recipient ? action.recipient.value : '';
  const recipientDisplayValue =
    ('displayName' in action.recipient ? action.recipient.displayName : '') || recipientValue;
  const isSearchable =
    recipientType === GuardrailRecipientType.User || recipientType === GuardrailRecipientType.Group;
  const searchKind = recipientType === GuardrailRecipientType.User ? 'user' : 'group';
  const searchPlaceholder =
    searchKind === 'user' ? labels.userSearchPlaceholder : labels.groupSearchPlaceholder;

  const appPickerCtx: GuardrailAppPickerContext = {
    app: action.app.name ? action.app : null,
    onChange: (app) => onChange({ ...action, app: app ?? { id: '', version: '', name: '' } }),
    label: labels.actionAppLabel,
    error: errors?.actionApp,
  };

  const fields = (
    <>
      {/* Recipient type */}
      <FormField>
        <Label htmlFor="escalate-recipient-type">{labels.assignToLabel}</Label>
        <Select value={String(recipientType)} onValueChange={handleRecipientTypeChange}>
          <SelectTrigger
            id="escalate-recipient-type"
            aria-label={`${labels.assignToLabel}: ${recipientTypeLabels[recipientType] ?? labels.recipientFallbackLabel}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(recipientTypeLabels).map(([typeValue, label]) => (
              <SelectItem key={typeValue} value={typeValue}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* Recipient value */}
      <FormField>
        <Label>
          {recipientTypeLabels[recipientType] ?? labels.recipientFallbackLabel}
          <RequiredIndicator />
        </Label>
        {isSearchable ? (
          <>
            {renderRecipientSearch ? (
              renderRecipientSearch({
                kind: searchKind,
                displayValue: recipientDisplayValue,
                placeholder: searchPlaceholder,
                invalid: Boolean(errors?.recipient),
                onSelect: handleRecipientSelect,
                onClear: handleRecipientClear,
              })
            ) : (
              // Fallback without a host directory search: a plain input writing the value directly.
              <Input
                value={recipientDisplayValue}
                onChange={(e) =>
                  handleRecipientSelect({ value: e.target.value, displayName: e.target.value })
                }
                placeholder={searchPlaceholder}
                aria-invalid={errors?.recipient ? true : undefined}
              />
            )}
            <FormFieldError>{errors?.recipient}</FormFieldError>
          </>
        ) : (
          <Input
            value={recipientValue}
            onChange={(e) => handleTextValueChange(e.target.value)}
            placeholder={
              recipientType === GuardrailRecipientType.StaticEmail
                ? labels.emailPlaceholder
                : labels.groupNamePlaceholder
            }
            error={errors?.recipient}
          />
        )}
      </FormField>

      {/* Action app picker (host capability) */}
      <FormField>
        {renderAppPicker ? (
          renderAppPicker(appPickerCtx)
        ) : (
          <>
            <Label>
              {labels.actionAppLabel}
              <RequiredIndicator />
            </Label>
            <Alert variant="info">
              <Info />
              <AlertDescription>{labels.appPickerUnavailable}</AlertDescription>
            </Alert>
          </>
        )}
      </FormField>
    </>
  );

  return (
    <div data-slot="guardrail-escalate-fields" className="@container space-y-3">
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 items-start">
        {actionTypeSelect}
        {fields}
      </div>
      {escalateHelp}
    </div>
  );
}
