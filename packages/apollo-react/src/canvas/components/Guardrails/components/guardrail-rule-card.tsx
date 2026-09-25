import {
  Button,
  FormField,
  FormFieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uipath/apollo-wind';
import { Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { formatGuardrailFormMessage, type GuardrailRulesLabels } from '../i18n';
import {
  GUARDRAIL_RULE_OPERATORS,
  type GuardrailFieldGroup,
  type GuardrailFieldRule,
  type GuardrailFieldRuleType,
  type GuardrailNumberRule,
  type GuardrailRule,
  type GuardrailRuleErrors,
  type GuardrailRuleFieldSelectorContext,
  type GuardrailRuleFieldSelectorRenderer,
  type GuardrailRuleOperator,
} from '../rules-types';
import {
  changeGuardrailRuleType,
  guardrailOperatorTakesValue,
  toggleGuardrailSelectorField,
} from '../rules-utils';
import { GuardrailFieldPicker } from './guardrail-field-picker';

type LabelKey = keyof GuardrailRulesLabels;

const RULE_TYPE_LABEL_KEYS: Record<GuardrailFieldRuleType, LabelKey> = {
  word: 'ruleTypeWord',
  number: 'ruleTypeNumber',
  boolean: 'ruleTypeBoolean',
};

const OPERATOR_LABEL_KEYS: Record<GuardrailRuleOperator, LabelKey> = {
  contains: 'operatorContains',
  doesNotContain: 'operatorDoesNotContain',
  equals: 'operatorEquals',
  doesNotEqual: 'operatorDoesNotEqual',
  startsWith: 'operatorStartsWith',
  doesNotStartWith: 'operatorDoesNotStartWith',
  endsWith: 'operatorEndsWith',
  doesNotEndWith: 'operatorDoesNotEndWith',
  isEmpty: 'operatorIsEmpty',
  isNotEmpty: 'operatorIsNotEmpty',
  matchesRegex: 'operatorMatchesRegex',
  greaterThan: 'operatorGreaterThan',
  greaterThanOrEqual: 'operatorGreaterThanOrEqual',
  lessThan: 'operatorLessThan',
  lessThanOrEqual: 'operatorLessThanOrEqual',
};

export interface GuardrailRuleCardProps {
  /** Position in the section's `rules`, handed to the field-selector slot. */
  index: number;
  /** Counted from 1 among the field rules; names the card and its delete button. */
  position: number;
  rule: GuardrailFieldRule;
  /** Types the select offers; the rule's own type is always kept so its value displays. */
  ruleTypes: readonly GuardrailFieldRuleType[];
  fields: GuardrailFieldGroup;
  onChange: (rule: GuardrailRule) => void;
  onDelete: () => void;
  errors?: GuardrailRuleErrors;
  renderFieldSelector?: GuardrailRuleFieldSelectorRenderer;
  labels: GuardrailRulesLabels;
}

// Holds the raw text while the input is focused, so clearing it or typing a leading minus is
// not overwritten by the parsed number on the next render. Blur shows the stored value again.
function NumberValueInput({
  id,
  rule,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  rule: GuardrailNumberRule;
  onChange: (rule: GuardrailRule) => void;
  error?: string;
  placeholder: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      id={id}
      type="number"
      step="any"
      value={draft ?? String(rule.value)}
      placeholder={placeholder}
      error={error}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = Number.parseFloat(e.target.value);
        onChange({ ...rule, value: Number.isFinite(parsed) ? parsed : 0 });
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

/** One field rule: its type, the fields it checks, the operator, and the value to compare. */
export function GuardrailRuleCard({
  index,
  position,
  rule,
  ruleTypes,
  fields,
  onChange,
  onDelete,
  errors,
  renderFieldSelector,
  labels,
}: GuardrailRuleCardProps) {
  // Namespaced per card: every rule renders the same four fields.
  const uid = useId();
  const typeOptions = ruleTypes.includes(rule.$ruleType)
    ? ruleTypes
    : [...ruleTypes, rule.$ruleType];

  const fieldSelectorContext: GuardrailRuleFieldSelectorContext = {
    index,
    ruleType: rule.$ruleType,
    selector: rule.fieldSelector,
    fields,
    onChange: (fieldSelector) => onChange({ ...rule, fieldSelector }),
    label: labels.fieldsLabel,
    labelId: `${uid}-fields-label`,
    invalid: Boolean(errors?.fields),
    error: errors?.fields,
  };
  const customFieldSelector = renderFieldSelector?.(fieldSelectorContext);

  // A <fieldset> needs its <legend> as the first child, which draws it on the border line; the
  // scope selector makes the same call.
  return (
    // biome-ignore lint/a11y/useSemanticElements: see above.
    <div
      role="group"
      aria-labelledby={`${uid}-title`}
      data-slot="guardrail-rule"
      className="rounded-lg border border-border p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span id={`${uid}-title`} className="text-xs font-medium text-muted-foreground">
          {formatGuardrailFormMessage(labels.ruleTitle, { position })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="3xs"
          icon
          aria-label={formatGuardrailFormMessage(labels.deleteRule, { position })}
          // Ghost restates its foreground under `future:` and on hover, so the destructive
          // tint has to win in all four scopes or the button greys out under the pointer.
          className="text-destructive future:text-destructive hover:text-destructive future:hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 items-start">
        <FormField>
          <FormFieldLabel htmlFor={`${uid}-type`} required>
            {labels.ruleTypeLabel}
          </FormFieldLabel>
          <Select
            value={rule.$ruleType}
            onValueChange={(type) =>
              onChange(changeGuardrailRuleType(rule, type as GuardrailFieldRuleType))
            }
          >
            <SelectTrigger id={`${uid}-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {labels[RULE_TYPE_LABEL_KEYS[type]]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {customFieldSelector === undefined ? (
          <GuardrailFieldPicker
            id={`${uid}-fields`}
            labelId={fieldSelectorContext.labelId}
            label={labels.fieldsLabel}
            fields={fields}
            selected={
              rule.fieldSelector.$selectorType === 'specific' ? rule.fieldSelector.fields : []
            }
            onToggle={(field) =>
              fieldSelectorContext.onChange(toggleGuardrailSelectorField(rule.fieldSelector, field))
            }
            allFields={{
              label: labels.allFields,
              selected: rule.fieldSelector.$selectorType === 'all',
              onSelect: () => fieldSelectorContext.onChange({ $selectorType: 'all' }),
            }}
            error={errors?.fields}
            labels={labels}
          />
        ) : (
          <FormField>
            <FormFieldLabel id={fieldSelectorContext.labelId} required>
              {labels.fieldsLabel}
            </FormFieldLabel>
            {customFieldSelector}
          </FormField>
        )}

        <FormField>
          <FormFieldLabel htmlFor={`${uid}-operator`} required>
            {labels.operatorLabel}
          </FormFieldLabel>
          <Select
            value={rule.operator}
            onValueChange={(operator) => onChange({ ...rule, operator } as GuardrailFieldRule)}
          >
            <SelectTrigger id={`${uid}-operator`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GUARDRAIL_RULE_OPERATORS[rule.$ruleType].map((operator) => (
                <SelectItem key={operator} value={operator}>
                  {labels[OPERATOR_LABEL_KEYS[operator]]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {guardrailOperatorTakesValue(rule.operator) && (
          <FormField>
            <FormFieldLabel htmlFor={`${uid}-value`} required>
              {labels.valueLabel}
            </FormFieldLabel>
            {rule.$ruleType === 'word' && (
              <Input
                id={`${uid}-value`}
                value={rule.value ?? ''}
                placeholder={labels.valuePlaceholder}
                error={errors?.value}
                onChange={(e) => onChange({ ...rule, value: e.target.value })}
              />
            )}
            {rule.$ruleType === 'number' && (
              <NumberValueInput
                id={`${uid}-value`}
                rule={rule}
                onChange={onChange}
                error={errors?.value}
                placeholder={labels.valuePlaceholder}
              />
            )}
            {rule.$ruleType === 'boolean' && (
              <Select
                value={String(rule.value)}
                onValueChange={(value) => onChange({ ...rule, value: value === 'true' })}
              >
                <SelectTrigger id={`${uid}-value`} error={errors?.value}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{labels.valueTrue}</SelectItem>
                  <SelectItem value="false">{labels.valueFalse}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormField>
        )}
      </div>
    </div>
  );
}
