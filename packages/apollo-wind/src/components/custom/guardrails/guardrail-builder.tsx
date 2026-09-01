import { Info } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import {
  GUARDRAIL_BYO_VALIDATOR_TYPE,
  type GuardrailAppPickerContext,
  type GuardrailBuilderErrors,
  type GuardrailBuilderValue,
  type GuardrailDefinition,
  type GuardrailRecipientSearchContext,
  type GuardrailScope,
  type GuardrailSelector,
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
  resolveGuardrailBuilderLabels,
} from './i18n';
import { loadGuardrailValidatorFormMessages } from './load-messages';
import {
  dropEmptyOptionalParameters,
  getRequiredEmptyParameterIds,
  syncMapEnumParameters,
} from './utils';

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
  /** Presence renders the "Save as new" secondary action (same validation gate as Save). */
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
  renderAppPicker?: (ctx: GuardrailAppPickerContext) => ReactNode;
  /** Rendered under the escalation grid (e.g. a marketplace help line). */
  escalateHelp?: ReactNode;
  /**
   * Host-supplied validation errors, merged over internal validation (host wins per field).
   * Host errors display immediately and gate Save like internal ones.
   */
  errors?: Partial<GuardrailBuilderErrors>;
  /** Locale for the builder's own strings; loads the built-in catalog, English fallback per key. */
  locale?: string;
  labels?: Partial<GuardrailBuilderLabels>;
  className?: string;
}

/** Resolve the builder's chrome strings: English synchronously, catalog async, overrides win. */
function useGuardrailBuilderLabels(
  locale?: string,
  overrides?: Partial<GuardrailBuilderLabels>
): GuardrailBuilderLabels {
  const [catalog, setCatalog] = useState<Partial<GuardrailBuilderLabels>>({});

  useEffect(() => {
    if (!locale) {
      setCatalog({});
      return;
    }
    let cancelled = false;
    loadGuardrailValidatorFormMessages(locale).then((messages) => {
      if (!cancelled) setCatalog(messages);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return useMemo(() => resolveGuardrailBuilderLabels(catalog, overrides), [catalog, overrides]);
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
  renderAppPicker,
  escalateHelp,
  errors: hostErrors,
  locale,
  labels: labelOverrides,
  className,
}: GuardrailBuilderProps) {
  const labels = useGuardrailBuilderLabels(locale, labelOverrides);

  const [formData, setFormData] = useState<GuardrailBuilderFormData>(() => {
    const data = initGuardrailBuilderFormData(definition, scope, guardrail, toolName);
    if (!guardrail && defaultName) data.name = defaultName;
    return data;
  });
  const [showErrors, setShowErrors] = useState(false);

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
    const trimmed = syncMapEnumParameters(formData.validatorParameters, definition.parameters).map(
      (param) =>
        param.$parameterType === 'text-list'
          ? { ...param, value: param.value.filter((entry) => entry.trim().length > 0) }
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

    const emptyParamIds = getRequiredEmptyParameterIds(
      definition.parameters,
      formData.validatorParameters
    );
    if (emptyParamIds.length > 0) {
      e.parameters = Object.fromEntries(
        emptyParamIds.map((id) => [id, labels.parameterRequiredError])
      );
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

  // Host errors display immediately and win per field; internal errors display after a
  // failed save attempt. Both gate Save.
  const displayErrors = useMemo<GuardrailBuilderErrors>(() => {
    const base: GuardrailBuilderErrors = showErrors ? { ...internalErrors } : {};
    if (hostErrors) {
      for (const [key, value] of Object.entries(hostErrors)) {
        if (value !== undefined) {
          (base as Record<string, unknown>)[key] =
            key === 'parameters'
              ? { ...base.parameters, ...(value as Record<string, string>) }
              : value;
        }
      }
    }
    return base;
  }, [showErrors, internalErrors, hostErrors]);

  const hasHostErrors = Boolean(
    hostErrors &&
      Object.values(hostErrors).some(
        (v) => v !== undefined && (typeof v !== 'object' || Object.keys(v).length > 0)
      )
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
    <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
      <AlertDescription>{definition.usageNote}</AlertDescription>
    </Alert>
  ) : null;

  const evalsToggle = (
    <div className="flex items-center gap-2">
      <Switch
        id="ootb-enable-evals"
        checked={formData.enabledForEvals}
        onCheckedChange={(checked) => updateField('enabledForEvals', checked)}
      />
      <Label htmlFor="ootb-enable-evals" className="text-sm font-normal cursor-pointer">
        {labels.evalsLabel}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info
            className="h-4 w-4 text-muted-foreground cursor-pointer"
            aria-label={labels.evalsInfoAriaLabel}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px]">
          {labels.evalsTooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const validatorFormErrors = displayErrors.parameters;

  const formBody = (
    <div className={cn('space-y-4 py-4', className)}>
      {statusBanner}
      {usageNote}

      {/* Guardrail type (read-only in edit mode — matches the type selector in the create flow) */}
      {guardrail && (
        <div className="space-y-2">
          <Label htmlFor="ootb-type">{labels.typeLabel}</Label>
          <Input id="ootb-type" value={definition.displayName} disabled readOnly />
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="ootb-name">
          {labels.nameLabel} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ootb-name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder={labels.namePlaceholder}
          className={cn(displayErrors.name && 'border-destructive')}
        />
        {displayErrors.name && <p className="text-xs text-destructive">{displayErrors.name}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="ootb-description">{labels.descriptionLabel}</Label>
        <Textarea
          id="ootb-description"
          rows={1}
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={labels.descriptionPlaceholder}
          className="resize-y !min-h-0"
        />
      </div>

      {/* Validator parameters */}
      {definition.parameters.length > 0 && (
        <div className="space-y-3">
          <GuardrailValidatorForm
            parameterDefinitions={definition.parameters}
            parameters={formData.validatorParameters}
            onChange={(params) => updateField('validatorParameters', params)}
            errors={validatorFormErrors}
            locale={locale}
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

      <hr className="border-border" />

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
        disabled: !isDefinitionAvailable,
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
      saveDisabled={!isDefinitionAvailable}
      footerStart={evalsTogglePlacement === 'footer' ? evalsToggle : undefined}
      labels={{ cancel: labels.cancel, save: labels.save }}
    >
      {formBody}
    </GuardrailFormLayout>
  );
}
GuardrailBuilder.displayName = 'GuardrailBuilder';
