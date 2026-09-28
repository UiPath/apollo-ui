import { cn, Separator } from '@uipath/apollo-wind';
import { type ReactNode, useCallback, useId, useMemo, useRef, useState } from 'react';
import type {
  GuardrailAction,
  GuardrailAppPickerContext,
  GuardrailRecipientSearchContext,
  GuardrailStaticRecipientContext,
} from './builder-types';
import { GuardrailActionSection } from './components/guardrail-action-section';
import { GuardrailEvalsToggle } from './components/guardrail-evals-toggle';
import { GuardrailNameFields } from './components/guardrail-name-fields';
import { MixedScopesBanner } from './components/mixed-scopes-banner';
import type {
  CustomGuardrailBuilderErrors,
  CustomGuardrailBuilderValue,
} from './custom-builder-types';
import {
  type CustomGuardrailBuilderFormData,
  getCustomGuardrailErrorFields,
  initCustomGuardrailBuilderFormData,
} from './custom-builder-utils';
import { GuardrailFilterFieldSelector } from './guardrail-filter-field-selector';
import { GuardrailFormLayout } from './guardrail-form-layout';
import { GuardrailRulesSection } from './guardrail-rules-section';
import { type CustomGuardrailBuilderLabels, useCustomGuardrailBuilderLabels } from './i18n';
import type {
  GuardrailFieldGroup,
  GuardrailRule,
  GuardrailRuleErrors,
  GuardrailRuleFieldSelectorRenderer,
  GuardrailRuleFields,
} from './rules-types';
import { type GuardrailErrorMerges, useGuardrailFormErrors } from './use-guardrail-form-errors';
import { useSwallowEnter } from './use-swallow-enter';

// Host rule errors merge over the internal ones rule by rule, and field by field within a rule.
const CUSTOM_BUILDER_ERROR_MERGES: GuardrailErrorMerges<CustomGuardrailBuilderErrors> = {
  perRule: {
    merge: (internal, host) =>
      Array.from(
        { length: Math.max(internal?.length ?? 0, host.length) },
        (_, index): GuardrailRuleErrors | undefined => {
          const fromHost = host[index];
          const own = internal?.[index];
          if (!fromHost) return own;
          return { fields: fromHost.fields ?? own?.fields, value: fromHost.value ?? own?.value };
        }
      ),
    hasMessage: (host) =>
      host.some((rule) => rule?.fields !== undefined || rule?.value !== undefined),
  },
};

export interface CustomGuardrailBuilderProps {
  /**
   * Drives the Dialog in modal mode only. Form state initializes from
   * `guardrail`/`defaultName`/`toolName` at mount — remount (with a new `key`) to reset.
   */
  open: boolean;
  /** Edit mode: initial value, copied verbatim into form state. */
  guardrail?: CustomGuardrailBuilderValue;
  /** Default name for new guardrails (host-generated unique name). */
  defaultName?: string;
  /** Other guardrail names, for case-insensitive duplicate validation. */
  existingNames?: string[];
  /** Current tool node name — targeted through `matchNames` when creating. */
  toolName?: string;
  /**
   * The fields each rule type may target, as `GuardrailRulesSection` takes them. Omit when the
   * tool has no schema: every rule type is then offered, targeting all fields.
   */
  fields?: GuardrailRuleFields;
  /** The fields a filter action may remove, of any type. Omit when the tool has no schema. */
  filterFields?: GuardrailFieldGroup | null;
  onSave: (guardrail: CustomGuardrailBuilderValue) => void;
  onCancel: () => void;
  /**
   * Presence renders the "Save as new" secondary action (same validation gate as Save).
   *
   * The copy carries the **original guardrail's selector verbatim**, including scopes this
   * screen does not show: there is no scope selector here, so a guardrail that also targets
   * the Agent or other tools still targets them in the copy. That is deliberate — "save as new"
   * duplicates a guardrail rather than re-scoping it, and silently narrowing coverage would be
   * the more dangerous default for a safety control. A host that wants the copy scoped to the
   * current tool owns that transformation: narrow `guardrail.selector` before persisting what
   * this callback hands you.
   */
  onSaveAsNew?: (guardrail: CustomGuardrailBuilderValue) => void;
  /** Pre-localized labels; renders the mixed-scopes banner when non-null. */
  otherAppliedScopes?: { scopes: string[]; tools: string[] } | null;
  inline?: boolean;
  hideHeader?: boolean;
  /**
   * Max width of the modal dialog in pixels. Default 800: a rule lays its four fields out two
   * by two below 48rem of width and in one row above it, and 800 keeps the modal in the first.
   */
  dialogMaxWidth?: number;
  /** Overrides the "Add/Edit custom guardrail" title. */
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
  /** Replace the field picker of a rule. Return `undefined` to fall through to the built-in one. */
  renderFieldSelector?: GuardrailRuleFieldSelectorRenderer;
  /** Also lists picked fields as removable chips, under each rule's picker and the filter's. */
  selectionChips?: boolean;
  /**
   * Asked before switching always-enforce on would drop rules the user edited; the switch
   * applies once it returns or resolves `true`. Without it the switch applies at once.
   */
  confirmAlwaysEnforce?: () => boolean | Promise<boolean>;
  /** Documentation link closing the help line. Without it the line's second sentence is omitted. */
  docsHref?: string;
  /** Called when the documentation link is followed (e.g. to record telemetry). */
  onDocsLinkClick?: () => void;
  /**
   * Host-supplied validation errors, merged over internal validation (host wins per field).
   * Host errors display immediately and gate Save like internal ones.
   */
  errors?: Partial<CustomGuardrailBuilderErrors>;
  /**
   * Extra host-owned Save gate, OR'd with the builder's own (e.g. while an async resolution
   * a slot started is still in flight).
   */
  saveDisabled?: boolean;
  labels?: Partial<CustomGuardrailBuilderLabels>;
  className?: string;
}

/**
 * The complete Add/Edit screen for a custom guardrail: help line, name, description, rules,
 * action (filter and escalation included), evaluations toggle, mixed-scopes banner, and the
 * Save/Cancel/Save-as-new footer. Custom guardrails target tools, so there is no scope
 * selector: an edited guardrail keeps its selector as it is.
 *
 * Owns its form state (initialized at mount — remount via `key` to reset) and its validation
 * (gating Save); hosts can override any message via `labels` or any field via `errors`.
 * Requires an ancestor `TooltipProvider`.
 */
export function CustomGuardrailBuilder({
  open,
  guardrail,
  defaultName,
  existingNames,
  toolName,
  fields,
  filterFields,
  onSave,
  onCancel,
  onSaveAsNew,
  otherAppliedScopes = null,
  inline = false,
  hideHeader = false,
  dialogMaxWidth = 800,
  title,
  evalsTogglePlacement = 'form',
  renderRecipientSearch,
  renderStaticRecipient,
  renderAppPicker,
  escalateHelp,
  renderFieldSelector,
  selectionChips = false,
  confirmAlwaysEnforce,
  docsHref,
  onDocsLinkClick,
  errors: hostErrors,
  saveDisabled: hostSaveDisabled = false,
  labels: labelOverrides,
  className,
}: CustomGuardrailBuilderProps) {
  const labels = useCustomGuardrailBuilderLabels(labelOverrides);
  // Namespaced per instance: two builders can share a document (inline panels).
  const uid = useId();

  const [formData, setFormData] = useState<CustomGuardrailBuilderFormData>(() => {
    const data = initCustomGuardrailBuilderFormData(guardrail, toolName);
    if (!guardrail && defaultName) data.name = defaultName;
    return data;
  });

  const rootRef = useRef<HTMLDivElement>(null);
  useSwallowEnter(rootRef);

  const updateField = useCallback(
    <K extends keyof CustomGuardrailBuilderFormData>(
      field: K,
      value: CustomGuardrailBuilderFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // The section emits a filter action only when the type switches to it, with no fields yet;
  // the filter selector edits them as field references from there.
  const handleActionChange = useCallback(
    (action: GuardrailAction) =>
      updateField(
        'action',
        action.$actionType === 'filter' ? { $actionType: 'filter', fields: [] } : action
      ),
    [updateField]
  );

  // The rules live here, so the section's `next` is applied here once the host confirms.
  const handleRequestAlwaysEnforce = useCallback(
    (next: GuardrailRule[]) => {
      if (!confirmAlwaysEnforce) return;
      const answer = confirmAlwaysEnforce();
      if (typeof answer === 'boolean') {
        if (answer) updateField('rules', next);
        return;
      }
      void answer.then((confirmed) => {
        if (confirmed) updateField('rules', next);
      });
    },
    [confirmAlwaysEnforce, updateField]
  );

  // Saved exactly as edited: the rules section renders every rule it holds, so nothing hidden
  // can reach the value.
  const guardrailResult = useMemo<CustomGuardrailBuilderValue>(
    () => ({
      id: formData.id,
      $guardrailType: 'custom',
      name: formData.name,
      description: formData.description || undefined,
      selector: formData.selector,
      action: formData.action,
      enabledForEvals: formData.enabledForEvals,
      rules: formData.rules,
    }),
    [formData]
  );

  const internalErrors = useMemo<CustomGuardrailBuilderErrors>(() => {
    const failing = getCustomGuardrailErrorFields(formData, existingNames);
    const e: CustomGuardrailBuilderErrors = {};
    if (failing.name) {
      e.name = failing.name === 'required' ? labels.nameRequiredError : labels.nameDuplicateError;
    }

    const [rulesField] = failing.rules;
    if (rulesField) {
      e.rules = {
        required: labels.rulesRequiredError,
        alwaysCombined: labels.rulesAlwaysCombinedError,
        invalidRules: labels.rulesInvalidError,
      }[rulesField];
    }
    if (failing.perRule.some((ruleFields) => ruleFields.length > 0)) {
      e.perRule = failing.perRule.map((ruleFields) =>
        ruleFields.length === 0
          ? undefined
          : {
              fields: ruleFields.includes('fields') ? labels.ruleFieldsRequiredError : undefined,
              value: ruleFields.includes('value') ? labels.ruleValueRequiredError : undefined,
            }
      );
    }

    for (const field of failing.action) {
      e[field] = {
        blockReason: labels.blockReasonRequiredError,
        filterFields: labels.filterFieldsRequiredError,
        recipient: labels.recipientRequiredError,
        actionApp: labels.actionAppRequiredError,
      }[field];
    }
    return e;
  }, [formData, existingNames, labels]);

  // Host errors display immediately and win per field; internal errors display after a
  // failed save attempt. Both gate Save.
  const { displayErrors, isValid, revealErrors } = useGuardrailFormErrors(
    internalErrors,
    hostErrors,
    CUSTOM_BUILDER_ERROR_MERGES
  );

  const handleSave = useCallback(() => {
    if (!isValid) {
      revealErrors();
      return;
    }
    onSave(guardrailResult);
  }, [guardrailResult, onSave, isValid, revealErrors]);

  // Hands the host `guardrailResult` unchanged — selector included. See `onSaveAsNew`.
  const handleSaveAsNew = useCallback(() => {
    if (!onSaveAsNew) return;
    if (!isValid) {
      revealErrors();
      return;
    }
    onSaveAsNew(guardrailResult);
  }, [guardrailResult, onSaveAsNew, isValid, revealErrors]);

  const evalsToggle = (
    <GuardrailEvalsToggle
      idPrefix={`${uid}-custom`}
      checked={formData.enabledForEvals}
      onCheckedChange={(checked) => updateField('enabledForEvals', checked)}
      labels={labels}
    />
  );

  // A translation that drops the token still renders the link, after the sentence.
  const [docsBefore, docsAfter] = labels.helpDocs.split('{{docsLink}}');

  const formBody = (
    <div
      ref={rootRef}
      data-slot="custom-guardrail-builder"
      className={cn('space-y-4 py-4', className)}
    >
      <p data-slot="custom-guardrail-builder-help" className="text-sm text-muted-foreground">
        {labels.helpText}
        {docsHref !== undefined && (
          <>
            {' '}
            {docsBefore}
            <a
              href={docsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              onClick={onDocsLinkClick}
            >
              {labels.docsLink}
            </a>
            {docsAfter}
          </>
        )}
      </p>

      <GuardrailNameFields
        idPrefix={`${uid}-custom`}
        name={formData.name}
        description={formData.description}
        onNameChange={(name) => updateField('name', name)}
        onDescriptionChange={(description) => updateField('description', description)}
        nameError={displayErrors.name}
        labels={labels}
      />

      <GuardrailRulesSection
        rules={formData.rules}
        onRulesChange={(rules) => updateField('rules', rules)}
        fields={fields}
        onRequestAlwaysEnforce={confirmAlwaysEnforce ? handleRequestAlwaysEnforce : undefined}
        renderFieldSelector={renderFieldSelector}
        selectionChips={selectionChips}
        errors={{ rules: displayErrors.rules, perRule: displayErrors.perRule }}
      />

      <Separator />

      {/* Action section */}
      <div className="space-y-3">
        <GuardrailActionSection
          action={formData.action}
          onActionChange={handleActionChange}
          showFilter
          filterContent={
            <GuardrailFilterFieldSelector
              fields={filterFields}
              value={formData.action.$actionType === 'filter' ? formData.action.fields : []}
              onChange={(picked) =>
                updateField('action', { $actionType: 'filter', fields: picked })
              }
              error={displayErrors.filterFields}
              selectionChips={selectionChips}
            />
          }
          // `filterFields` renders in the selector, tied to its trigger.
          errors={{
            blockReason: displayErrors.blockReason,
            recipient: displayErrors.recipient,
            actionApp: displayErrors.actionApp,
          }}
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
    ? { label: labels.saveAsNew, onClick: handleSaveAsNew, disabled: hostSaveDisabled }
    : undefined;

  return (
    <GuardrailFormLayout
      open={open}
      title={title ?? (guardrail ? labels.editTitle : labels.addTitle)}
      onSave={handleSave}
      onCancel={onCancel}
      inline={inline}
      hideHeader={hideHeader}
      dialogMaxWidth={dialogMaxWidth}
      secondaryAction={secondaryAction}
      saveDisabled={hostSaveDisabled}
      footerStart={evalsTogglePlacement === 'footer' ? evalsToggle : undefined}
      labels={{ cancel: labels.cancel, save: labels.save }}
    >
      {formBody}
    </GuardrailFormLayout>
  );
}
CustomGuardrailBuilder.displayName = 'CustomGuardrailBuilder';
