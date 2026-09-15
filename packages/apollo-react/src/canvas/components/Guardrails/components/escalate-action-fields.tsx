import {
  Alert,
  AlertDescription,
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
import { Info } from 'lucide-react';
import { type ReactNode, useCallback, useId } from 'react';
import {
  type GuardrailAppPickerContext,
  type GuardrailEscalateAction,
  type GuardrailEscalateActionErrors,
  type GuardrailEscalateRecipient,
  type GuardrailRecipientSearchContext,
  GuardrailRecipientType,
  type GuardrailStaticRecipientContext,
} from '../builder-types';
import { type GuardrailActionLabels, useGuardrailActionLabels } from '../i18n';

export interface EscalateActionFieldsProps {
  action: GuardrailEscalateAction;
  onChange: (action: GuardrailEscalateAction) => void;
  /**
   * Leading grid cell (the Action type select). When provided, this component owns the full
   * escalate layout; omit it to render the escalation fields on their own.
   */
  actionTypeSelect?: ReactNode;
  /**
   * Render the field cells as a fragment, for a surrounding grid to lay out. Ignored when
   * `actionTypeSelect` is provided.
   */
  asGridItems?: boolean;
  /** Host-owned validation messages; each renders as soon as it is present. */
  errors?: GuardrailEscalateActionErrors;
  /** Per-string overrides. Anything omitted resolves from the canvas lingui catalog. */
  labels?: Partial<GuardrailActionLabels>;
  renderRecipientSearch?: (ctx: GuardrailRecipientSearchContext) => ReactNode;
  renderStaticRecipient?: (ctx: GuardrailStaticRecipientContext) => ReactNode | undefined;
  renderAppPicker?: (ctx: GuardrailAppPickerContext) => ReactNode;
  /** Rendered under the escalation grid (e.g. a marketplace help line). */
  escalateHelp?: ReactNode;
  /** Ignored in the `asGridItems` layout, which renders no element of its own. */
  className?: string;
}

/**
 * Escalation action fields: recipient type + recipient value + action-app picker. The
 * recipient autosuggest (User/Group) and the app picker are host capabilities injected via
 * render props; plain-input / unavailable-note fallbacks keep the form usable without them.
 *
 * Three layouts, one per way the hosts compose it: with `actionTypeSelect` it owns the whole
 * escalate grid (what `GuardrailActionSection` passes), with `asGridItems` it emits the three
 * cells for a surrounding grid, and with neither it stacks them.
 */
export function EscalateActionFields({
  action,
  onChange,
  actionTypeSelect,
  asGridItems = false,
  errors,
  labels: labelOverrides,
  renderRecipientSearch,
  renderStaticRecipient,
  renderAppPicker,
  escalateHelp,
  className,
}: EscalateActionFieldsProps) {
  const labels = useGuardrailActionLabels(labelOverrides);
  // Namespaced per instance — two builders can share a document (inline panels).
  const uid = useId();

  const recipientTypeLabels: Record<number, string> = {
    [GuardrailRecipientType.User]: labels.recipientUserLabel,
    [GuardrailRecipientType.Group]: labels.recipientGroupLabel,
    [GuardrailRecipientType.StaticEmail]: labels.recipientEmailLabel,
    [GuardrailRecipientType.StaticGroupName]: labels.recipientGroupNameLabel,
  };

  const recipientType = action.recipient.type;
  // The type select offers the four base entries; asset variants (a host-slot concern)
  // display as their static siblings so the selection never blanks.
  const displayedRecipientType =
    recipientType === GuardrailRecipientType.AssetEmail
      ? GuardrailRecipientType.StaticEmail
      : recipientType === GuardrailRecipientType.AssetGroupName
        ? GuardrailRecipientType.StaticGroupName
        : recipientType;

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
      } else if (
        r.type === GuardrailRecipientType.AssetEmail ||
        r.type === GuardrailRecipientType.AssetGroupName
      ) {
        onChange({ ...action, recipient: { ...r, assetName: value } });
      }
    },
    [action, onChange]
  );

  const recipientValue =
    'value' in action.recipient ? action.recipient.value : action.recipient.assetName;
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
        <Label htmlFor={`${uid}-escalate-recipient-type`}>{labels.assignToLabel}</Label>
        <Select value={String(displayedRecipientType)} onValueChange={handleRecipientTypeChange}>
          <SelectTrigger
            id={`${uid}-escalate-recipient-type`}
            aria-label={`${labels.assignToLabel}: ${recipientTypeLabels[displayedRecipientType] ?? labels.recipientFallbackLabel}`}
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
          {recipientTypeLabels[displayedRecipientType] ?? labels.recipientFallbackLabel}
          <RequiredIndicator />
        </Label>
        {/* One rule across all three slots, matching `renderAppPicker`: a slot receives `error`
            and owns rendering it, so the form renders no message of its own for a claimed field.
            The sibling `FormFieldError` used to sit outside this ternary, so a host doing the
            obvious `<Input error={ctx.error} />` got the message twice. Every fallback goes
            through `Input`'s `error` prop, which renders the message *and* wires
            aria-describedby / aria-errormessage / aria-invalid — the searchable fallback set
            aria-invalid by hand and left the message associated with nothing. */}
        {isSearchable ? (
          renderRecipientSearch ? (
            renderRecipientSearch({
              kind: searchKind,
              displayValue: recipientDisplayValue,
              placeholder: searchPlaceholder,
              invalid: Boolean(errors?.recipient),
              error: errors?.recipient,
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
              error={errors?.recipient}
            />
          )
        ) : (
          (() => {
            const staticNode = renderStaticRecipient?.({
              kind:
                displayedRecipientType === GuardrailRecipientType.StaticEmail
                  ? 'email'
                  : 'groupName',
              recipient: action.recipient,
              label: recipientTypeLabels[displayedRecipientType] ?? labels.recipientFallbackLabel,
              invalid: Boolean(errors?.recipient),
              error: errors?.recipient,
              onChange: (recipient) => onChange({ ...action, recipient }),
            });
            // The slot owns the message; see the note above.
            if (staticNode !== undefined) return staticNode;
            return (
              <Input
                value={recipientValue}
                onChange={(e) => handleTextValueChange(e.target.value)}
                placeholder={
                  displayedRecipientType === GuardrailRecipientType.StaticEmail
                    ? labels.emailPlaceholder
                    : labels.groupNamePlaceholder
                }
                error={errors?.recipient}
              />
            );
          })()
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
            {/* `mt-0` cancels the AlertDescription top offset, which assumes an AlertTitle
                above it and otherwise drops the text 4px below the icon. */}
            <Alert variant="info">
              <Info />
              <AlertDescription className="mt-0">{labels.appPickerUnavailable}</AlertDescription>
            </Alert>
            {/* The builder still gates Save on `actionApp` when no picker slot is supplied,
                so without this the user is blocked with the reason rendered nowhere. */}
            <FormFieldError>{errors?.actionApp}</FormFieldError>
          </>
        )}
      </FormField>
    </>
  );

  if (actionTypeSelect) {
    return (
      <div data-slot="guardrail-escalate-fields" className={cn('@container space-y-3', className)}>
        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 items-start">
          {actionTypeSelect}
          {fields}
        </div>
        {escalateHelp}
      </div>
    );
  }

  if (asGridItems) return fields;

  return (
    <div data-slot="guardrail-escalate-fields" className={cn('space-y-3', className)}>
      {fields}
      {escalateHelp}
    </div>
  );
}
