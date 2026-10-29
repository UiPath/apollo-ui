import { Form, type LucideIcon, SquareFunction } from 'lucide-react';
import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ConditionsEditor,
  type ConditionVocabulary,
  createCondition,
  createConditionGroup,
} from '@/components/ui/conditions-editor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ValueModeMenuItem } from '@/components/ui/field-addons/field-menu';
import { FormField, FormFieldError, FormFieldLabel } from '@/components/ui/form-field';
import { RowDeleteButton } from '@/components/ui/row-groups';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type RuleExpressionEditorProps, useRulesEditor } from './context';
import { isBlank, type Rule, type RuleMode, type RulesDialect, withMode } from './model';

/**
 * The rule in the other mode, carried across by the dialect, or `undefined` if that would lose
 * content. The dialect is asked first, even for no conditions, which it may write as an expression
 * that always holds.
 */
function switched(
  rule: Rule,
  dialect: RulesDialect | undefined,
  vocabulary: ConditionVocabulary
): Rule | undefined {
  if (rule.mode === 'conditions') {
    const expression =
      dialect?.toExpression?.(rule.conditions, vocabulary) ?? (isBlank(rule) ? '' : undefined);
    return expression === undefined
      ? undefined
      : withMode(rule, { mode: 'expression', expression });
  }
  if (isBlank(rule)) return withMode(rule, { mode: 'conditions', conditions: oneCondition() });
  const conditions = dialect?.fromExpression?.(rule.expression, vocabulary);
  return conditions && withMode(rule, { mode: 'conditions', conditions });
}

const oneCondition = () => createConditionGroup('all', [createCondition()]);

// What can take focus in a rule's body, for when the control that had it is gone.
const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), textarea:not(:disabled)';

function BuiltInExpressionEditor({
  id,
  value,
  onChange,
  onBlur,
  labelledBy,
  invalid,
  errorId,
  disabled,
  placeholder,
}: RuleExpressionEditorProps) {
  return (
    <Textarea
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      minRows={2}
      maxRows={8}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      className="font-mono text-xs"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      aria-describedby={errorId}
      aria-errormessage={errorId}
    />
  );
}

/**
 * One rule: its outcome, then the conditions or the expression that decide when it applies.
 * Memoised, so typing in one rule leaves the others alone.
 */
export const RuleCard = React.memo(function RuleCard({
  rule,
  index,
  position,
  onDelete,
}: {
  rule: Rule;
  /** 1-based, for names. */
  index: number;
  /** 0-based, for focus after a delete. */
  position: number;
  onDelete: (id: string, position: number) => void;
}) {
  const editor = useRulesEditor();
  const { strings: text, disabled, updateRule } = editor;
  const [touched, setTouched] = React.useState(
    () => editor.defaultTouched?.includes(rule.id) ?? false
  );
  // The target outlives `open`, so the dialog keeps its text while it closes.
  const [confirm, setConfirm] = React.useState<{ open: boolean; target: RuleMode }>({
    open: false,
    target: 'expression',
  });
  const baseId = React.useId();
  const ids = {
    name: `${baseId}-name`,
    outcome: `${baseId}-outcome`,
    expression: `${baseId}-expression`,
    expressionLabel: `${baseId}-expression-label`,
    outcomeError: `${baseId}-outcome-error`,
    expressionError: `${baseId}-expression-error`,
  };
  const ruleName = text.ruleName(index);
  const conditionsName = text.ruleConditions(ruleName);

  const modeRef = React.useRef<HTMLButtonElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  // Back to the mode menu, or, when it is gone (an expression rule switched back where new ones are
  // not allowed), to the rule's first control.
  const restoreFocus = () => {
    if (modeRef.current?.isConnected) modeRef.current.focus();
    else bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  };

  const apply = (next: Rule) => {
    // A blank expression the author left in the other mode is not one they have left in this one.
    setTouched(false);
    updateRule(next);
  };
  const switchMode = (mode: RuleMode) => {
    if (mode === rule.mode) return;
    const next = switched(rule, editor.dialect, editor.vocabulary);
    if (next) apply(next);
    else setConfirm({ open: true, target: mode });
  };
  const confirmSwitch = () => {
    apply(
      confirm.target === 'expression'
        ? withMode(rule, { mode: 'expression', expression: '' })
        : withMode(rule, { mode: 'conditions', conditions: oneCondition() })
    );
  };

  const outcomeKnown = editor.outcomes.some((option) => option.value === rule.outcome);
  // Only bad data names an outcome the editor does not offer, so it is flagged straight away.
  const outcomeError = outcomeKnown ? undefined : text.errorOutcome;
  const showModeToggle = editor.allowExpressions || rule.mode === 'expression';
  const modes: Record<RuleMode, { icon: LucideIcon; title: string; description: string }> = {
    conditions: {
      icon: Form,
      title: text.modeConditions,
      description: text.modeConditionsDescription,
    },
    expression: {
      icon: SquareFunction,
      title: text.modeExpression,
      description: text.modeExpressionDescription,
    },
  };
  const ModeIcon = modes[rule.mode].icon;

  let body: React.ReactNode;
  if (rule.mode === 'conditions') {
    body = (
      <ConditionsEditor
        label={conditionsName}
        value={rule.conditions}
        onChange={(conditions) => updateRule({ ...rule, conditions })}
        fields={editor.vocabulary.fields}
        operators={editor.vocabulary.operators}
        valueModes={editor.vocabulary.valueModes}
        variables={editor.variables}
        renderValue={editor.renderValue}
        maxDepth={editor.maxDepth}
        showMatchMode={editor.showMatchMode}
        container="plain"
        forceErrors={editor.forceErrors}
        defaultTouched={editor.defaultTouched}
        disabled={disabled}
        strings={editor.conditionsStrings}
        valueModeStrings={editor.valueModeStrings}
        multiSelectStrings={editor.multiSelectStrings}
      />
    );
  } else {
    const error =
      (editor.forceErrors || touched) && rule.expression.trim() === ''
        ? text.errorExpression
        : undefined;
    const props: RuleExpressionEditorProps = {
      rule,
      id: ids.expression,
      value: rule.expression,
      onChange: (expression) => updateRule({ ...rule, expression }),
      onBlur: () => setTouched(true),
      labelledBy: `${ids.name} ${ids.expressionLabel}`,
      invalid: Boolean(error),
      errorId: error ? ids.expressionError : undefined,
      disabled,
      placeholder: text.expressionPlaceholder || undefined,
    };
    const custom = editor.renderExpressionEditor?.(props);
    body = (
      <FormField>
        <FormFieldLabel id={ids.expressionLabel} htmlFor={ids.expression}>
          {text.expressionLabel}
        </FormFieldLabel>
        {custom === undefined ? <BuiltInExpressionEditor {...props} /> : custom}
        {error && <FormFieldError id={ids.expressionError}>{error}</FormFieldError>}
      </FormField>
    );
  }

  return (
    <fieldset
      data-row=""
      aria-label={ruleName}
      className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border border-solid border-border bg-card p-3"
    >
      {/* The rule half of each control's name; the visible label supplies the rest. */}
      <span id={ids.name} className="sr-only">
        {ruleName}
      </span>
      <div className="flex flex-col">
        {/* On a narrow card the actions wrap to their own line, still on the right. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {/* The header reads as a sentence, "Show when", so the label is for assistive tech. */}
            <span id={ids.outcome} className="sr-only">
              {text.outcomeLabel}
            </span>
            <Select
              // An unknown outcome shows as unchosen, not as another outcome.
              value={outcomeKnown ? rule.outcome : ''}
              disabled={disabled}
              onValueChange={(outcome) => updateRule({ ...rule, outcome })}
            >
              <SelectTrigger
                data-row-first=""
                // As wide as the chosen outcome, so no outcome is cut off.
                className="w-auto shrink-0"
                aria-labelledby={`${ids.name} ${ids.outcome}`}
                aria-invalid={outcomeError ? true : undefined}
                aria-describedby={outcomeError ? ids.outcomeError : undefined}
                aria-errormessage={outcomeError ? ids.outcomeError : undefined}
              >
                <SelectValue placeholder={text.outcomePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {editor.outcomes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="flex h-9 shrink-0 items-center text-xs text-muted-foreground future:h-10">
              {text.when}
            </span>
          </div>
          <div className="ml-auto flex h-9 items-center gap-2 future:h-10">
            {showModeToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={modeRef}
                    type="button"
                    variant="ghost"
                    size="xs"
                    icon
                    disabled={disabled}
                    aria-label={text.ruleMode(ruleName, modes[rule.mode].title)}
                    title={text.ruleMode(ruleName, modes[rule.mode].title)}
                    className="px-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <ModeIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  onCloseAutoFocus={(event) => {
                    // A switch can take the menu's button with it; Radix would then drop focus.
                    if (modeRef.current?.isConnected) return;
                    event.preventDefault();
                    restoreFocus();
                  }}
                >
                  {(['conditions', 'expression'] as const).map((mode) => (
                    <ValueModeMenuItem
                      key={mode}
                      icon={modes[mode].icon}
                      label={modes[mode].title}
                      description={modes[mode].description}
                      active={rule.mode === mode}
                      onClick={() => switchMode(mode)}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <RowDeleteButton
              label={text.removeRule(index)}
              disabled={disabled}
              onClick={() => onDelete(rule.id, position)}
            />
          </div>
        </div>
        {outcomeError && <FormFieldError id={ids.outcomeError}>{outcomeError}</FormFieldError>}
      </div>

      <div
        ref={bodyRef}
        className="flex min-w-0 flex-col gap-3 border-l-2 border-solid border-border pl-3"
      >
        {body}
      </div>

      <AlertDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((current) => ({ ...current, open }))}
      >
        <AlertDialogContent
          // It opens from a menu item that is gone by now, so Radix would drop focus.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm.target === 'expression'
                ? text.switchToExpressionTitle
                : text.switchToConditionsTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.target === 'expression'
                ? text.switchToExpressionDescription
                : text.switchToConditionsDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={confirmSwitch}
            >
              {text.switchConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </fieldset>
  );
});
