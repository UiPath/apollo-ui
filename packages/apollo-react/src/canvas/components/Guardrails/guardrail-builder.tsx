import {
  Alert,
  AlertDescription,
  cn,
  FormField,
  FormFieldLabel,
  InfoTooltip,
  Input,
  Label,
  Separator,
  Switch,
  Textarea,
} from '@uipath/apollo-wind';
import { Info } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  GUARDRAIL_BYO_VALIDATOR_TYPE,
  type GuardrailAppPickerContext,
  type GuardrailBuilderErrors,
  type GuardrailBuilderValue,
  type GuardrailDefinition,
  type GuardrailRecipientSearchContext,
  type GuardrailScope,
  type GuardrailSelector,
  type GuardrailStaticRecipientContext,
} from './builder-types';
import {
  type GuardrailBuilderFormData,
  getGuardrailActionErrorFields,
  getGuardrailSelectorErrorFields,
  initGuardrailBuilderFormData,
} from './builder-utils';
import { GuardrailActionSection } from './components/guardrail-action-section';
import { GuardrailScopeSelector } from './components/guardrail-scope-selector';
import { GuardrailStatusBanner } from './components/guardrail-status-banner';
import { MixedScopesBanner } from './components/mixed-scopes-banner';
import { GuardrailFormLayout } from './guardrail-form-layout';
import { GuardrailValidatorForm } from './guardrail-validator-form';
import {
  formatGuardrailFormMessage,
  type GuardrailBuilderLabels,
  useGuardrailBuilderLabels,
} from './i18n';
import type { GuardrailValidatorFormProps } from './types';
import {
  dropEmptyOptionalParameters,
  getOutOfRangeParameterIds,
  getRequiredEmptyParameterIds,
  syncMapEnumParameters,
} from './utils';

const EMPTY_PARAM_IDS: ReadonlySet<string> = new Set();

export interface GuardrailBuilderProps {
  /**
   * Drives the Dialog in modal mode only. Form state initializes from
   * `definition`/`guardrail`/`defaultName` at mount — remount (with a new `key`) to reset.
   */
  open: boolean;
  definition: GuardrailDefinition;
  /** Where the screen was opened from. The scope selector renders only when 'Agent'. */
  scope: GuardrailScope;
  /** Edit mode: initial value, copied verbatim into form state. */
  guardrail?: GuardrailBuilderValue;
  /** Default name for new guardrails (host-generated unique name). */
  defaultName?: string;
  /** Other guardrail names, for case-insensitive duplicate validation. */
  existingNames?: string[];
  /** Current tool node name — pre-selected as matchNames when creating at Tool scope. */
  toolName?: string;
  /** Tool names available for targeting (shown when Tool scope is selected). */
  availableToolNames?: string[];
  onSave: (guardrail: GuardrailBuilderValue) => void;
  onCancel: () => void;
  /**
   * Presence renders the "Save as new" secondary action (same validation gate as Save).
   *
   * The copy carries the **original guardrail's selector verbatim**, including scopes the
   * current screen does not show: opened from a Tool, the scope selector is hidden, so a
   * mixed-scope guardrail duplicated there still targets the Agent and any other tools it
   * already covered. That is deliberate — "save as new" duplicates a guardrail rather than
   * re-scoping it, and silently narrowing coverage would be the more dangerous default for a
   * safety control. A host that wants the copy scoped to the current tool owns that
   * transformation: narrow `guardrail.selector` before persisting what this callback hands you.
   */
  onSaveAsNew?: (guardrail: GuardrailBuilderValue) => void;
  /** Pre-localized labels; renders the mixed-scopes banner when non-null. */
  otherAppliedScopes?: { scopes: string[]; tools: string[] } | null;
  inline?: boolean;
  hideHeader?: boolean;
  dialogMaxWidth?: number;
  /** Overrides the computed "Add/Edit {{name}} guardrail" title. */
  title?: ReactNode;
  /** Where the enable-for-evaluations switch renders. Default 'form'. */
  evalsTogglePlacement?: 'form' | 'footer';
  renderRecipientSearch?: (ctx: GuardrailRecipientSearchContext) => ReactNode;
  /**
   * Replace the editor for static/asset recipients (types 3/4/5/6). Return `undefined` to
   * fall through to the built-in plain input.
   */
  renderStaticRecipient?: (ctx: GuardrailStaticRecipientContext) => ReactNode | undefined;
  renderAppPicker?: (ctx: GuardrailAppPickerContext) => ReactNode;
  /** Rendered under the escalation grid (e.g. a marketplace help line). */
  escalateHelp?: ReactNode;
  /**
   * Host-supplied validation errors, merged over internal validation (host wins per field).
   * Host errors display immediately and gate Save like internal ones.
   */
  errors?: Partial<GuardrailBuilderErrors>;
  /**
   * Forwarded to the internal `GuardrailValidatorForm`: replace the editor for individual
   * validator parameters (e.g. mounting a product model picker for a judge-model parameter).
   */
  renderParameter?: GuardrailValidatorFormProps['renderParameter'];
  /**
   * Forwarded to the internal `GuardrailValidatorForm`: the parameter ids `renderParameter`
   * claims. Declaring them avoids the deprecated probe, which calls your renderer once per
   * definition on every render — see `GuardrailValidatorFormProps.overrideParameterIds`.
   */
  overrideParameterIds?: GuardrailValidatorFormProps['overrideParameterIds'];
  /**
   * Extra host-owned Save gate, OR'd with the builder's own (e.g. while an async resolution
   * a slot started is still in flight).
   */
  saveDisabled?: boolean;
  labels?: Partial<GuardrailBuilderLabels>;
  className?: string;
}

/**
 * The complete Add/Edit screen for an OOTB guardrail validator: status banners, usage note,
 * type display (edit mode), name, description, validator parameters, scope selector, action
 * (incl. escalation via host slots), evaluations toggle, mixed-scopes banner, and the
 * Save/Cancel/Save-as-new footer.
 *
 * Owns its form state (initialized at mount — remount via `key` to reset) and its validation
 * (gating Save); hosts can override any message via `labels` or any field via `errors`.
 * Requires an ancestor `TooltipProvider`.
 */
export function GuardrailBuilder({
  open,
  definition,
  scope,
  guardrail,
  defaultName,
  existingNames,
  toolName,
  availableToolNames,
  onSave,
  onCancel,
  onSaveAsNew,
  otherAppliedScopes = null,
  inline = false,
  hideHeader = false,
  dialogMaxWidth,
  title,
  evalsTogglePlacement = 'form',
  renderRecipientSearch,
  renderStaticRecipient,
  renderAppPicker,
  escalateHelp,
  errors: hostErrors,
  renderParameter,
  overrideParameterIds,
  saveDisabled: hostSaveDisabled = false,
  labels: labelOverrides,
  className,
}: GuardrailBuilderProps) {
  const labels = useGuardrailBuilderLabels(labelOverrides);

  // Control ids are namespaced per instance: the public API supports inline panels, so two
  // builders can share a document. Constant ids would duplicate, and `htmlFor` would bind a
  // label to whichever instance rendered first.
  const uid = useId();

  const [formData, setFormData] = useState<GuardrailBuilderFormData>(() => {
    const data = initGuardrailBuilderFormData(definition, scope, guardrail, toolName);
    if (!guardrail && defaultName) data.name = defaultName;
    return data;
  });
  const [showErrors, setShowErrors] = useState(false);

  // Parameter ids the user has edited since the host last published `errors`. A host error is
  // a verdict on a value; once that value changes the verdict is stale, and without this it
  // kept displaying and kept Save gated until the host happened to republish. Reset whenever
  // the host hands us a new errors object, so a fresh verdict on the same field shows again.
  const [editedParamIds, setEditedParamIds] = useState<ReadonlySet<string>>(EMPTY_PARAM_IDS);
  // biome-ignore lint/correctness/useExhaustiveDependencies: identity of the host's errors
  // object is the signal — a new object means a new verdict, regardless of its contents.
  useEffect(() => {
    setEditedParamIds(EMPTY_PARAM_IDS);
  }, [hostErrors]);

  // The nested MetadataForm guards the fields it owns, but the builder renders single-line
  // inputs of its own (name, and the escalation recipient/app fallbacks) outside that div.
  // Mounted `inline` inside a host's <form>, Enter in one of those triggers the host's
  // implicit submission and skips `handleSave` entirely — no validation, no callback. Same
  // treatment as apollo-wind's `container='div'`: swallow Enter for single-line inputs only,
  // so textareas keep newlines and buttons keep activation. Bound natively because the root
  // is a passive container with no ARIA role to declare.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const swallowEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.type !== 'button') {
        event.preventDefault();
      }
    };

    node.addEventListener('keydown', swallowEnter);
    return () => node.removeEventListener('keydown', swallowEnter);
  }, []);

  const showScopeSelector = scope === 'Agent';

  const updateField = useCallback(
    <K extends keyof GuardrailBuilderFormData>(field: K, value: GuardrailBuilderFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSelectorChange = useCallback(
    (selector: GuardrailSelector) => updateField('selector', selector),
    [updateField]
  );

  const guardrailResult = useMemo<GuardrailBuilderValue>(() => {
    // Reconcile map-enum values with their source enum-list selection, then drop empty /
    // whitespace-only text-list entries — otherwise reopening the guardrail surfaces phantom
    // rows the author never filled in. Finally drop optional params left empty: runtimes
    // require persisted values to be non-empty.
    // Trim only text-lists this definition actually declares, and guard the runtime value.
    // Dispatching on the wire discriminator alone reached host sidecars too — parameters written
    // through `onParametersChange` that have no definition here — so a sidecar carrying
    // `$parameterType: 'text-list'` with a malformed value crashed this memo during render.
    // Sidecars are the host's shape to own, so they pass through untouched.
    const textListIds = new Set(
      definition.parameters.filter((p) => p.type === 'text-list').map((p) => p.id)
    );
    const trimmed = syncMapEnumParameters(formData.validatorParameters, definition.parameters).map(
      (param) =>
        param.$parameterType === 'text-list' &&
        textListIds.has(param.id) &&
        Array.isArray(param.value)
          ? {
              ...param,
              value: param.value.filter(
                (entry) => typeof entry === 'string' && entry.trim().length > 0
              ),
            }
          : param
    );
    const validatorParameters = dropEmptyOptionalParameters(trimmed, definition.parameters);
    const isByo = definition.byoValidatorName !== undefined;
    return {
      id: formData.id,
      $guardrailType: 'builtInValidator',
      name: formData.name,
      description: formData.description || undefined,
      selector: formData.selector,
      action: formData.action,
      enabledForEvals: formData.enabledForEvals,
      validatorType: isByo ? GUARDRAIL_BYO_VALIDATOR_TYPE : definition.validator,
      validatorParameters,
      ...(isByo ? { byoValidatorName: definition.byoValidatorName } : {}),
    };
  }, [formData, definition]);

  const internalErrors = useMemo<GuardrailBuilderErrors>(() => {
    const e: GuardrailBuilderErrors = {};
    if (!formData.name.trim()) {
      e.name = labels.nameRequiredError;
    } else if (existingNames?.some((n) => n.toLowerCase() === formData.name.trim().toLowerCase())) {
      e.name = labels.nameDuplicateError;
    }

    if (showScopeSelector) {
      for (const field of getGuardrailSelectorErrorFields(formData.selector)) {
        e[field] = field === 'scopes' ? labels.scopesRequiredError : labels.toolsRequiredError;
      }
    }

    // Both host-side predicates gate Save. Range matters because `min`/`max` reach the input
    // only as DOM attributes, which browsers enforce on native submission — and this form has
    // none, so without this a typed out-of-range threshold saved silently.
    //
    // Validate what will actually be persisted, not what the editor is holding: MapEnumField
    // deliberately keeps rows for deselected keys, while the save path prunes them through
    // `syncMapEnumParameters`. Reading the raw values let a required map look filled by a
    // stale key and then save as `{}`, and let a deselected out-of-range threshold block Save
    // over a value that was never going to be written.
    const reconciledParameters = syncMapEnumParameters(
      formData.validatorParameters,
      definition.parameters
    );

    const parameterErrors: Record<string, string> = {};
    for (const id of getRequiredEmptyParameterIds(definition.parameters, reconciledParameters)) {
      parameterErrors[id] = labels.parameterRequiredError;
    }
    for (const id of getOutOfRangeParameterIds(definition.parameters, reconciledParameters)) {
      // Required wins: an empty field is the more actionable message of the two.
      parameterErrors[id] ??= labels.parameterOutOfRangeError;
    }
    if (Object.keys(parameterErrors).length > 0) {
      e.parameters = parameterErrors;
    }

    for (const field of getGuardrailActionErrorFields(formData.action)) {
      e[field] = {
        blockReason: labels.blockReasonRequiredError,
        filterFields: labels.filterFieldsRequiredError,
        recipient: labels.recipientRequiredError,
        actionApp: labels.actionAppRequiredError,
      }[field];
    }
    return e;
  }, [formData, showScopeSelector, definition.parameters, existingNames, labels]);

  // Host parameter errors minus the ones the user has already edited past.
  const liveHostParameterErrors = useMemo<Record<string, string>>(() => {
    const fromHost = hostErrors?.parameters;
    if (!fromHost) return {};
    return Object.fromEntries(Object.entries(fromHost).filter(([id]) => !editedParamIds.has(id)));
  }, [hostErrors, editedParamIds]);

  // Host errors display immediately and win per field; internal errors display after a
  // failed save attempt. Both gate Save.
  const displayErrors = useMemo<GuardrailBuilderErrors>(() => {
    const base: GuardrailBuilderErrors = showErrors ? { ...internalErrors } : {};
    if (hostErrors) {
      for (const [key, value] of Object.entries(hostErrors)) {
        if (value !== undefined) {
          (base as Record<string, unknown>)[key] =
            key === 'parameters' ? { ...base.parameters, ...liveHostParameterErrors } : value;
        }
      }
    }
    return base;
  }, [showErrors, internalErrors, hostErrors, liveHostParameterErrors]);

  const hasHostErrors = Boolean(
    hostErrors &&
      Object.entries(hostErrors).some(([key, v]) => {
        if (v === undefined) return false;
        // `parameters` is the one host error the user can invalidate by typing; every other
        // key stays until the host withdraws it.
        if (key === 'parameters') return Object.keys(liveHostParameterErrors).length > 0;
        return typeof v !== 'object' || Object.keys(v).length > 0;
      })
  );
  const isValid = Object.keys(internalErrors).length === 0 && !hasHostErrors;
  const isDefinitionAvailable = definition.status === 'Available';

  const handleSave = useCallback(() => {
    if (!isDefinitionAvailable) return;
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSave(guardrailResult);
  }, [guardrailResult, onSave, isValid, isDefinitionAvailable]);

  // Hands the host `guardrailResult` unchanged — selector included. See `onSaveAsNew` for why
  // the copy is not re-scoped here even when the scope selector is hidden.
  const handleSaveAsNew = useCallback(() => {
    if (!onSaveAsNew) return;
    if (!isDefinitionAvailable) return;
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSaveAsNew(guardrailResult);
  }, [guardrailResult, onSaveAsNew, isValid, isDefinitionAvailable]);

  const isByoConfigurationDisabled =
    definition.byoValidatorName !== undefined && definition.status === 'Disabled';

  const computedTitle = guardrail
    ? formatGuardrailFormMessage(labels.editTitle, { name: definition.displayName })
    : formatGuardrailFormMessage(labels.addTitle, { name: definition.displayName });

  const statusBanner = isByoConfigurationDisabled ? (
    <GuardrailStatusBanner tone="error" message={labels.byoDisabledMessage} />
  ) : definition.status === 'Unauthorised' ? (
    <GuardrailStatusBanner tone="warning" message={labels.unauthorizedMessage} />
  ) : definition.status === 'FeatureDisabled' ? (
    <GuardrailStatusBanner tone="warning" message={labels.featureDisabledMessage} />
  ) : null;

  const usageNote = definition.usageNote ? (
    <Alert variant="info" data-slot="guardrail-usage-note">
      <Info />
      <AlertDescription>{definition.usageNote}</AlertDescription>
    </Alert>
  ) : null;

  const evalsToggle = (
    <div className="flex items-center gap-2">
      <Switch
        id={`${uid}-ootb-enable-evals`}
        checked={formData.enabledForEvals}
        onCheckedChange={(checked) => updateField('enabledForEvals', checked)}
      />
      <Label variant="muted" htmlFor={`${uid}-ootb-enable-evals`} className="cursor-pointer">
        {labels.evalsLabel}
      </Label>
      <InfoTooltip content={labels.evalsTooltip} aria-label={labels.evalsInfoAriaLabel} />
    </div>
  );

  const validatorFormErrors = displayErrors.parameters;

  const formBody = (
    <div ref={rootRef} data-slot="guardrail-builder" className={cn('space-y-4 py-4', className)}>
      {statusBanner}
      {usageNote}

      {/* Guardrail type (read-only in edit mode — matches the type selector in the create flow) */}
      {guardrail && (
        <FormField>
          <Label htmlFor={`${uid}-ootb-type`}>{labels.typeLabel}</Label>
          <Input id={`${uid}-ootb-type`} value={definition.displayName} disabled readOnly />
        </FormField>
      )}

      {/* Name */}
      <FormField>
        <FormFieldLabel htmlFor={`${uid}-ootb-name`} required>
          {labels.nameLabel}
        </FormFieldLabel>
        <Input
          id={`${uid}-ootb-name`}
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder={labels.namePlaceholder}
          error={displayErrors.name}
        />
      </FormField>

      {/* Description */}
      <FormField>
        <Label htmlFor={`${uid}-ootb-description`}>{labels.descriptionLabel}</Label>
        <Textarea
          id={`${uid}-ootb-description`}
          minRows={1}
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={labels.descriptionPlaceholder}
        />
      </FormField>

      {/* Validator parameters */}
      {definition.parameters.length > 0 && (
        <div className="space-y-3">
          <GuardrailValidatorForm
            parameterDefinitions={definition.parameters}
            parameters={formData.validatorParameters}
            onChange={(params) => updateField('validatorParameters', params)}
            errors={validatorFormErrors}
            onClearError={(paramId) =>
              setEditedParamIds((prev) => {
                if (prev.has(paramId)) return prev;
                const next = new Set(prev);
                next.add(paramId);
                return next;
              })
            }
            renderParameter={renderParameter}
            overrideParameterIds={overrideParameterIds}
          />
        </div>
      )}

      {/* Scope selector (when opened from an agent node) */}
      {showScopeSelector && (
        <GuardrailScopeSelector
          selector={formData.selector}
          onChange={handleSelectorChange}
          availableToolNames={availableToolNames}
          allowedScopes={definition.allowedScopes}
          errors={{ scopes: displayErrors.scopes, toolNames: displayErrors.toolNames }}
          labels={labels}
        />
      )}

      <Separator />

      {/* Action section */}
      <div className="space-y-3">
        <GuardrailActionSection
          action={formData.action}
          onActionChange={(action) => updateField('action', action)}
          errors={{
            blockReason: displayErrors.blockReason,
            filterFields: displayErrors.filterFields,
            recipient: displayErrors.recipient,
            actionApp: displayErrors.actionApp,
          }}
          labels={labels}
          renderRecipientSearch={renderRecipientSearch}
          renderStaticRecipient={renderStaticRecipient}
          renderAppPicker={renderAppPicker}
          escalateHelp={escalateHelp}
        />
      </div>

      {/* Enable for evaluations */}
      {evalsTogglePlacement === 'form' && evalsToggle}

      {/* Mixed scopes info banner */}
      <MixedScopesBanner otherAppliedScopes={otherAppliedScopes} labels={labels} />
    </div>
  );

  const secondaryAction = onSaveAsNew
    ? {
        label: labels.saveAsNew,
        onClick: handleSaveAsNew,
        // `saveDisabled` gates saving, not one button: leaving it off the secondary action let
        // a host that reported "saving disabled" still have `onSaveAsNew` fired.
        disabled: !isDefinitionAvailable || hostSaveDisabled,
      }
    : undefined;

  return (
    <GuardrailFormLayout
      open={open}
      title={title ?? computedTitle}
      onSave={handleSave}
      onCancel={onCancel}
      inline={inline}
      hideHeader={hideHeader}
      dialogMaxWidth={dialogMaxWidth}
      secondaryAction={secondaryAction}
      saveDisabled={!isDefinitionAvailable || hostSaveDisabled}
      footerStart={evalsTogglePlacement === 'footer' ? evalsToggle : undefined}
      labels={{ cancel: labels.cancel, save: labels.save }}
    >
      {formBody}
    </GuardrailFormLayout>
  );
}
GuardrailBuilder.displayName = 'GuardrailBuilder';
