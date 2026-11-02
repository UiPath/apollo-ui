import { Network } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createCondition, createConditionGroup } from '@/components/ui/conditions-editor';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuickFormFieldHeader } from '@/components/ui/quick-form-field/components/header-context';
import {
  createRule,
  isUnconditionalRule,
  type Rule,
  RulesEditor,
  type RulesEditorProps,
  type RulesEditorStrings,
} from '@/components/ui/rules-editor';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { FIELD_ACTION_CLASS } from './collapse';

export interface RulesActionStrings {
  /** The trigger's accessible name and tooltip, given how many rules are set. */
  trigger: (count: number) => string;
  /** The popover's heading, which also names the rules list. */
  title: string;
  /** The Required switch's label. */
  required: string;
  /** Turns the Required switch's rule into one with conditions. */
  makeConditional: string;
}

export const DEFAULT_RULES_ACTION_STRINGS: RulesActionStrings = {
  trigger: (count) => (count > 0 ? `Field rules (${count})` : 'Field rules'),
  title: 'Field rules',
  required: 'Required field',
  makeConditional: 'Make conditional',
};

export interface RulesActionProps
  extends Omit<RulesEditorProps, 'label' | 'disabled' | 'className' | 'strings'> {
  /**
   * The outcome that requires the field. Its rule with no conditions, which always applies, shows
   * as a Required switch above the other rules. Omit where requiring the field is no choice.
   */
  requiredOutcome?: string;
  /** Disabled while an enclosing QuickFormField is, too. */
  disabled?: boolean;
  /** Overrides for any subset of the action's English strings. */
  strings?: Partial<RulesActionStrings>;
  /** Overrides for the rules editor's strings. */
  editorStrings?: Partial<RulesEditorStrings>;
}

/**
 * The field-rules header action: a RulesEditor in a popover, with an optional Required switch,
 * behind a trigger that counts the rules. The switch is a rule like the others, shown apart: on,
 * it is a `requiredOutcome` rule with no conditions, and Make conditional gives it one. Inside a QuickFormField's `headerActions` it follows
 * the field's `disabled`. Requires an ancestor `TooltipProvider`.
 *
 * Pair it with `useFieldRules` to store the rules as RulesEngine `FieldRule`s.
 */
export function RulesAction({
  requiredOutcome,
  disabled,
  strings,
  editorStrings,
  value,
  onChange,
  ...editor
}: RulesActionProps) {
  const header = useQuickFormFieldHeader();
  const inert = !!disabled || !!header?.disabled;
  const text = { ...DEFAULT_RULES_ACTION_STRINGS, ...strings };
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const requiredId = useId();
  const rulesList = useRef<HTMLDivElement>(null);
  // The rule Make conditional moved into the list, until its condition can take focus.
  const focusRule = useRef<{ position: number; rules: number } | null>(null);
  const count = value.length;
  const triggerLabel = text.trigger(count);

  const requiredIndex =
    requiredOutcome === undefined
      ? -1
      : value.findIndex((rule) => rule.outcome === requiredOutcome && isUnconditionalRule(rule));
  const requiredRule = requiredIndex < 0 ? undefined : value[requiredIndex];
  const rules = requiredRule ? value.filter((rule) => rule !== requiredRule) : value;
  // A rule that requires the field on conditions already says whether it is required.
  const showSwitch =
    requiredOutcome !== undefined &&
    (!!requiredRule || !rules.some((rule) => rule.outcome === requiredOutcome));
  // The switch's rule keeps its place among the rest, as later rules override earlier ones: after
  // the last rule that came before it and is still there.
  const changeRules = (next: Rule[]) => {
    if (!requiredRule) return onChange(next);
    const before = new Set(value.slice(0, requiredIndex).map((rule) => rule.id));
    const after = next.reduce((at, rule, position) => (before.has(rule.id) ? position + 1 : at), 0);
    onChange([...next.slice(0, after), requiredRule, ...next.slice(after)]);
  };
  const setRequired = (on: boolean) => {
    if (!requiredOutcome) return;
    onChange(
      on
        ? [createRule({ outcome: requiredOutcome, conditions: createConditionGroup() }), ...value]
        : [...rules]
    );
  };
  const makeConditional = () => {
    onChange(
      value.map((rule) =>
        rule === requiredRule && rule.mode === 'conditions'
          ? { ...rule, conditions: { ...rule.conditions, children: [createCondition()] } }
          : rule
      )
    );
    // The switch goes with its rule, so focus moves to the condition to fill in.
    focusRule.current = { position: requiredIndex, rules: rules.length + 1 };
  };
  // No deps: the host may pass the change back on any render.
  useEffect(() => {
    const next = focusRule.current;
    const cards = rulesList.current?.querySelectorAll<HTMLElement>(
      ':scope > fieldset > div > [data-row]'
    );
    if (!next || !cards || cards.length !== next.rules) return;
    focusRule.current = null;
    cards[next.position]?.querySelector<HTMLElement>(':scope [data-row] [data-row-first]')?.focus();
  });
  // The Required card says what an empty list would.
  const rulesStrings = useMemo(
    () => (showSwitch ? { ...editorStrings, empty: '' } : editorStrings),
    [showSwitch, editorStrings]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="3xs"
              icon
              aria-label={triggerLabel}
              disabled={inert}
              className={cn('relative', FIELD_ACTION_CLASS, (open || count > 0) && 'text-brand')}
            >
              <Network />
              {count > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand/15 px-0.5 text-[9px] font-medium leading-none text-brand"
                >
                  {count}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{triggerLabel}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={8}
        aria-labelledby={titleId}
        // What the flip and shift left over, so a field near the viewport's edge opens the other
        // way instead of shrinking to a scrolling sliver.
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[min(29rem,calc(100vw-2rem))] flex-col gap-2.5 overflow-y-auto p-3"
      >
        <div id={titleId} className="text-xs font-semibold text-foreground">
          {text.title}
        </div>
        {showSwitch && (
          // A fixed height, so Make conditional appearing does not move the rules below.
          <div className="flex h-10 items-center gap-2.5 rounded-lg border border-solid border-border bg-card px-3">
            <Switch
              id={requiredId}
              size="sm"
              checked={!!requiredRule}
              onCheckedChange={setRequired}
              disabled={inert}
            />
            <Label htmlFor={requiredId} className="flex-1 text-xs font-normal text-foreground">
              {text.required}
            </Label>
            {requiredRule && (
              <Button
                type="button"
                variant="ghost"
                size="3xs"
                onClick={makeConditional}
                disabled={inert}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {text.makeConditional}
              </Button>
            )}
          </div>
        )}
        <div ref={rulesList} className="contents">
          <RulesEditor
            {...editor}
            value={rules}
            onChange={changeRules}
            label={text.title}
            disabled={inert}
            strings={rulesStrings}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
