import {
  Button,
  cn,
  FormField,
  FormFieldError,
  FormFieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import { useId, useMemo } from 'react';
import { GuardrailRuleCard } from './components/guardrail-rule-card';
import { type GuardrailRulesLabels, useGuardrailRulesLabels } from './i18n';
import type {
  GuardrailAlwaysRule,
  GuardrailRule,
  GuardrailRuleApplyTo,
  GuardrailRuleFieldSelectorRenderer,
  GuardrailRuleFields,
  GuardrailRulesErrors,
} from './rules-types';
import {
  createGuardrailRule,
  getGuardrailFieldGroup,
  getGuardrailRuleTypeOptions,
  isGuardrailAlwaysEnforced,
  isPristineGuardrailRule,
  setGuardrailAlwaysEnforced,
} from './rules-utils';

export interface GuardrailRulesSectionProps {
  rules: readonly GuardrailRule[];
  /** Receives the whole next rule list. */
  onRulesChange: (rules: GuardrailRule[]) => void;
  /**
   * The fields each rule type may target. Only types with fields are offered, and with none the
   * guardrail can only be always enforced. Omit when the tool has no schema: every type is then
   * offered, targeting all fields.
   */
  fields?: GuardrailRuleFields;
  /**
   * Called instead of `onRulesChange` when switching always-enforce on would drop rules the user
   * edited. `rules` is the list it would become; confirm, then apply it yourself. Without it the
   * switch applies at once.
   */
  onRequestAlwaysEnforce?: (rules: GuardrailRule[]) => void;
  /** Replace the field picker of a rule. Return `undefined` to fall through to the built-in one. */
  renderFieldSelector?: GuardrailRuleFieldSelectorRenderer;
  /**
   * Also lists each rule's picked fields under its picker as removable chips. Off by default:
   * the trigger already summarizes the selection and the list shows each pick checked.
   */
  selectionChips?: boolean;
  /** Validation messages; each renders as soon as it is present. */
  errors?: GuardrailRulesErrors;
  /** Per-string overrides; anything omitted resolves from the canvas lingui catalog. */
  labels?: Partial<GuardrailRulesLabels>;
  className?: string;
}

const APPLY_TO_LABEL_KEYS: Record<GuardrailRuleApplyTo, keyof GuardrailRulesLabels> = {
  input: 'applyToInput',
  output: 'applyToOutput',
  inputAndOutput: 'applyToInputAndOutput',
};

/**
 * The rules of a custom guardrail: an always-enforce switch, or a list of field rules (type,
 * fields, operator, value) that must all match for the action to run. Controlled; requires an
 * ancestor `TooltipProvider`.
 */
export function GuardrailRulesSection({
  rules,
  onRulesChange,
  fields,
  onRequestAlwaysEnforce,
  renderFieldSelector,
  selectionChips = false,
  errors,
  labels: labelOverrides,
  className,
}: GuardrailRulesSectionProps) {
  const labels = useGuardrailRulesLabels(labelOverrides);
  // Namespaced per instance: two sections can share a document (inline panels).
  const uid = useId();

  const ruleTypes = useMemo(() => getGuardrailRuleTypeOptions(fields), [fields]);
  const defaultType = ruleTypes[0] ?? 'word';
  const enforced = isGuardrailAlwaysEnforced(rules);
  const alwaysRule = rules.find((rule): rule is GuardrailAlwaysRule => rule.$ruleType === 'always');

  const handleAlwaysEnforceChange = (checked: boolean) => {
    const next = setGuardrailAlwaysEnforced(rules, checked, defaultType);
    const dropsEdits =
      checked &&
      rules.some((rule) => rule.$ruleType !== 'always' && !isPristineGuardrailRule(rule));
    if (dropsEdits && onRequestAlwaysEnforce) onRequestAlwaysEnforce(next);
    else onRulesChange(next);
  };

  // Numbered among the field rules; `index` stays the rule's place in `rules`.
  const fieldRules = rules.flatMap((rule, index) =>
    rule.$ruleType === 'always' ? [] : [{ rule, index }]
  );

  return (
    <div data-slot="guardrail-rules-section" className={cn('@container space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <FormFieldLabel
          htmlFor={`${uid}-always`}
          tooltip={
            <>
              <p>{labels.alwaysEnforceEnabledHint}</p>
              <p className="mt-1">{labels.alwaysEnforceDisabledHint}</p>
            </>
          }
          tooltipAriaLabel={labels.moreInformation}
        >
          {labels.alwaysEnforceLabel}
        </FormFieldLabel>
        <Switch
          id={`${uid}-always`}
          checked={enforced}
          // With no rule type to offer the guardrail can only be always enforced; a stored
          // value that is not stays switchable, so it can still be fixed.
          disabled={enforced && ruleTypes.length === 0}
          onCheckedChange={handleAlwaysEnforceChange}
        />
      </div>

      {alwaysRule && (
        <FormField>
          <FormFieldLabel htmlFor={`${uid}-apply-to`} required>
            {labels.applyToLabel}
          </FormFieldLabel>
          <Select
            value={alwaysRule.applyTo}
            onValueChange={(applyTo) =>
              onRulesChange(
                rules.map((rule) =>
                  rule === alwaysRule
                    ? { ...alwaysRule, applyTo: applyTo as GuardrailRuleApplyTo }
                    : rule
                )
              )
            }
          >
            <SelectTrigger id={`${uid}-apply-to`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(APPLY_TO_LABEL_KEYS) as GuardrailRuleApplyTo[]).map((applyTo) => (
                <SelectItem key={applyTo} value={applyTo}>
                  {labels[APPLY_TO_LABEL_KEYS[applyTo]]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      {fieldRules.map(({ rule, index }, i) => (
        <GuardrailRuleCard
          // Rules carry no ids on the wire. Every control in a card is controlled, so an index
          // key only ever hands a card the rule now at its position.
          key={index}
          index={index}
          position={i + 1}
          rule={rule}
          ruleTypes={ruleTypes}
          fields={getGuardrailFieldGroup(fields, rule.$ruleType)}
          onChange={(next) =>
            onRulesChange(rules.map((current, j) => (j === index ? next : current)))
          }
          onDelete={() => onRulesChange(rules.filter((_, j) => j !== index))}
          errors={errors?.perRule?.[index]}
          renderFieldSelector={renderFieldSelector}
          selectionChips={selectionChips}
          labels={labels}
        />
      ))}

      <FormFieldError>{errors?.rules}</FormFieldError>

      {!enforced && ruleTypes.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRulesChange([...rules, createGuardrailRule(defaultType)])}
        >
          <Plus />
          {labels.addRule}
        </Button>
      )}
    </div>
  );
}
