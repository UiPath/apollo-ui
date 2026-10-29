import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  type ConditionField,
  createCondition,
  createConditionGroup,
} from '@/components/ui/conditions-editor';
import type { RuleExpressionEditorProps } from './context';
import {
  type ConditionsRule,
  createRule,
  type ExpressionRule,
  isRuleComplete,
  isUnconditionalRule,
  type PreservedRule,
  type Rule,
  type RuleOutcome,
  withMode,
} from './model';
import { RulesEditor, type RulesEditorProps } from './rules-editor';

const FIELDS: ConditionField[] = [
  { value: 'name', label: 'Name', type: 'string' },
  { value: 'amount', label: 'Amount', type: 'number' },
];

const OUTCOMES: RuleOutcome[] = [
  { value: 'show', label: 'Show' },
  { value: 'hide', label: 'Hide' },
  { value: 'require', label: 'Require' },
];

function conditionsRule(id: string, conditions = [createCondition()]): ConditionsRule {
  return createRule({
    id,
    outcome: 'show',
    conditions: createConditionGroup('all', conditions, `${id}-group`),
  });
}

function expressionRule(id: string, expression: string): ExpressionRule {
  return createRule({ id, outcome: 'show', expression });
}

function Harness({
  initial,
  onValue,
  ...props
}: Partial<RulesEditorProps> & { initial: Rule[]; onValue?: (value: Rule[]) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <RulesEditor
      label="Field behavior"
      outcomes={OUTCOMES}
      fields={FIELDS}
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

function lastValue(onValue: ReturnType<typeof vi.fn>): Rule[] {
  return onValue.mock.lastCall?.[0];
}

async function choose(trigger: HTMLElement, option: string) {
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('model', () => {
  it('creates a conditions rule with one empty condition, or an expression rule', () => {
    const rule = createRule({ outcome: 'show' });
    expect(rule.mode).toBe('conditions');
    expect(rule.id).toMatch(/^rule-/);
    expect(rule.mode === 'conditions' && rule.conditions.children).toHaveLength(1);
    expect(createRule({ outcome: 'hide', expression: 'a > 1' })).toEqual({
      id: expect.any(String),
      outcome: 'hide',
      mode: 'expression',
      expression: 'a > 1',
    });
  });

  it('gives each new rule its own id', () => {
    expect(createRule({ outcome: 'show' }).id).not.toBe(createRule({ outcome: 'show' }).id);
  });

  it('says whether a rule runs as written, by the checks the editor flags', () => {
    const vocabulary = { outcomes: OUTCOMES, fields: FIELDS };
    const filled = createCondition({ field: 'name', operator: 'equals', value: 'x' });
    expect(isRuleComplete(expressionRule('r', ' '), vocabulary)).toBe(false);
    expect(isRuleComplete(expressionRule('r', 'a > 1'), vocabulary)).toBe(true);
    expect(isRuleComplete(conditionsRule('r', []), vocabulary)).toBe(true);
    const preserved: PreservedRule = {
      id: 'r',
      outcome: 'show',
      mode: 'preserved',
      preservedSource: '',
    };
    expect(isRuleComplete(preserved, vocabulary)).toBe(true);
    expect(isRuleComplete(conditionsRule('r'), vocabulary)).toBe(false);
    expect(isRuleComplete(conditionsRule('r', [filled]), vocabulary)).toBe(true);
    // An outcome the editor does not offer.
    expect(
      isRuleComplete({ ...conditionsRule('r', [filled]), outcome: 'archive' }, vocabulary)
    ).toBe(false);
    // An empty nested group.
    expect(
      isRuleComplete(conditionsRule('r', [filled, createConditionGroup('any')]), vocabulary)
    ).toBe(false);
  });

  it('checks value modes against the editor’s, as it resolves them', () => {
    const variable = createCondition({
      field: 'amount',
      operator: 'equals',
      valueMode: 'variable',
      value: '$vars.limit',
    });
    const rule = conditionsRule('r', [variable]);
    // Without variables the editor offers no Variable mode, so it reads the reference as a number.
    expect(isRuleComplete(rule, { outcomes: OUTCOMES, fields: FIELDS })).toBe(false);
    expect(
      isRuleComplete(rule, {
        outcomes: OUTCOMES,
        fields: FIELDS,
        variables: [{ id: 'limit', label: 'limit', value: '$vars.limit' }],
      })
    ).toBe(true);
  });

  it('keeps a host’s own properties through a mode change', () => {
    const rule = { ...expressionRule('r', 'x'), source: 'legacy' };
    expect(withMode(rule, { mode: 'conditions', conditions: createConditionGroup() })).toEqual({
      id: 'r',
      outcome: 'show',
      source: 'legacy',
      mode: 'conditions',
      conditions: expect.objectContaining({ kind: 'group' }),
    });
  });

  it('tells a rule with no conditions apart', () => {
    expect(isUnconditionalRule(conditionsRule('a', []))).toBe(true);
    expect(isUnconditionalRule(conditionsRule('b'))).toBe(false);
    expect(isUnconditionalRule(expressionRule('c', ''))).toBe(false);
  });
});

describe('RulesEditor', () => {
  it('names each rule and its controls by position', () => {
    render(<Harness initial={[conditionsRule('a'), expressionRule('b', 'x > 1')]} />);
    expect(screen.getByRole('group', { name: 'Field behavior' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Rule 1' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveTextContent('Show');
    expect(screen.getByRole('group', { name: 'Rule 1 conditions' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Rule 2 Expression' })).toHaveValue('x > 1');
    expect(screen.getByRole('button', { name: 'Remove rule 2' })).toBeInTheDocument();
  });

  it('changes a rule’s outcome and leaves the other rules as they were', async () => {
    const onValue = vi.fn();
    const initial = [conditionsRule('a'), conditionsRule('b')];
    render(<Harness initial={initial} onValue={onValue} />);
    await choose(screen.getByRole('combobox', { name: 'Rule 2 Outcome' }), 'Require');
    const next = lastValue(onValue);
    expect(next[1].outcome).toBe('require');
    expect(next[0]).toBe(initial[0]);
  });

  it('shows nothing for no rules when the empty text is blank', () => {
    const { container } = render(<Harness initial={[]} strings={{ empty: '' }} />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('adds a rule with the default outcome and moves focus to it', async () => {
    const onValue = vi.fn();
    render(<Harness initial={[]} defaultOutcome="hide" onValue={onValue} />);
    expect(screen.getByText('No rules.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(lastValue(onValue)).toEqual([
      expect.objectContaining({ outcome: 'hide', mode: 'conditions' }),
    ]);
    expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveFocus();
  });

  it('defaults a new rule to the first outcome', async () => {
    const onValue = vi.fn();
    render(<Harness initial={[]} onValue={onValue} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(lastValue(onValue)[0].outcome).toBe('show');
  });

  it('removes a rule and moves focus to the next one’s delete', async () => {
    const onValue = vi.fn();
    render(<Harness initial={[conditionsRule('a'), conditionsRule('b')]} onValue={onValue} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove rule 1' }));
    expect(lastValue(onValue).map((rule) => rule.id)).toEqual(['b']);
    expect(screen.getByRole('button', { name: 'Remove rule 1' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Remove rule 1' }));
    expect(screen.getByRole('button', { name: 'Add rule' })).toHaveFocus();
    expect(screen.getByText('No rules.')).toBeInTheDocument();
  });

  it('passes its condition settings through to each rule', async () => {
    const { unmount } = render(<Harness forceErrors initial={[conditionsRule('a')]} />);
    expect(screen.getByText('Select a field and enter a value.')).toBeInTheDocument();
    // Always flat.
    expect(screen.queryByRole('button', { name: 'Add group' })).not.toBeInTheDocument();
    unmount();

    const touched = createCondition({ id: 'visited' });
    const { unmount: unmountTouched } = render(
      <Harness defaultTouched={['visited']} initial={[conditionsRule('a', [touched])]} />
    );
    expect(screen.getByText('Select a field and enter a value.')).toBeInTheDocument();
    unmountTouched();

    render(
      <Harness
        variables={[{ id: 'limit', label: 'limit', value: '$vars.limit' }]}
        valueModeStrings={{ variableTitle: 'Variable globale' }}
        initial={[conditionsRule('a', [createCondition({ field: 'amount' })])]}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /^Condition 1 Value mode/ }));
    expect(
      await screen.findByRole('menuitemradio', { name: /^Variable globale/ })
    ).toBeInTheDocument();
  });

  it('re-renders only the rule being edited', async () => {
    const seen: string[] = [];
    const renderExpressionEditor = (props: RuleExpressionEditorProps) => {
      seen.push(props.rule.id);
      return undefined;
    };
    render(
      <Harness
        renderExpressionEditor={renderExpressionEditor}
        initial={[expressionRule('a', ''), expressionRule('b', '')]}
      />
    );
    seen.length = 0;
    await userEvent.type(screen.getByRole('textbox', { name: 'Rule 1 Expression' }), 'xy');
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((id) => id === 'a')).toBe(true);
  });

  it('lets the host hide the rules’ All / Any switch', () => {
    render(
      <Harness
        showMatchMode={false}
        initial={[conditionsRule('a', [createCondition(), createCondition()])]}
      />
    );
    expect(screen.queryByRole('radio', { name: 'Any (OR)' })).not.toBeInTheDocument();
  });

  it('shows the rule’s All / Any switch only once it has two conditions', async () => {
    const onValue = vi.fn();
    render(<Harness initial={[conditionsRule('a')]} onValue={onValue} />);
    expect(screen.queryByRole('radio', { name: 'Any (OR)' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    const toggle = screen.getByRole('group', { name: 'Rule 1 conditions match mode' });
    await userEvent.click(within(toggle).getByRole('radio', { name: 'Any (OR)' }));
    const [rule] = lastValue(onValue) as ConditionsRule[];
    expect(rule.conditions.mode).toBe('any');
    expect(rule.conditions.children).toHaveLength(2);
  });

  it('passes condition edits through', async () => {
    const onValue = vi.fn();
    render(<Harness initial={[conditionsRule('a')]} onValue={onValue} />);
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'Amount');
    const [rule] = lastValue(onValue) as ConditionsRule[];
    expect(rule.conditions.children[0]).toMatchObject({ field: 'amount', operator: 'equals' });
  });

  describe('switching between conditions and an expression', () => {
    const toggle = (position = 1) =>
      screen.getByRole('button', { name: new RegExp(`^Rule ${position} mode: `) });
    const switchTo = async (mode: 'Conditions' | 'Expression') => {
      await userEvent.click(toggle());
      await userEvent.click(
        await screen.findByRole('menuitemradio', { name: new RegExp(`^${mode}`) })
      );
    };

    it('switches blank conditions without asking', async () => {
      const onValue = vi.fn();
      render(<Harness initial={[conditionsRule('a')]} onValue={onValue} />);
      await switchTo('Expression');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(lastValue(onValue)).toEqual([
        { id: 'a', outcome: 'show', mode: 'expression', expression: '' },
      ]);
      expect(screen.getByRole('textbox', { name: 'Rule 1 Expression' })).toHaveValue('');
    });

    it('lists both modes with the current one checked, and names the menu by it', async () => {
      render(<Harness initial={[conditionsRule('a')]} />);
      await userEvent.click(toggle());
      const conditions = await screen.findByRole('menuitemradio', { name: /^Conditions/ });
      expect(conditions).toHaveAttribute('aria-checked', 'true');
      expect(conditions).toHaveTextContent('Pick fields, operators, and values.');
      const expression = screen.getByRole('menuitemradio', { name: /^Expression/ });
      expect(expression).toHaveAttribute('aria-checked', 'false');
      await userEvent.click(expression);
      expect(toggle()).toHaveAccessibleName('Rule 1 mode: Expression');
    });

    it('does nothing when the current mode is picked again', async () => {
      const onValue = vi.fn();
      render(<Harness initial={[expressionRule('a', 'x')]} onValue={onValue} />);
      await switchTo('Expression');
      expect(onValue).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('asks before dropping chosen options, even with no field', async () => {
      render(<Harness initial={[conditionsRule('a', [createCondition({ values: ['open'] })])]} />);
      await switchTo('Expression');
      expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    });

    it('asks the dialect about a rule with no conditions', async () => {
      const onValue = vi.fn();
      render(
        <Harness
          initial={[conditionsRule('a', [])]}
          dialect={{ toExpression: () => 'true' }}
          onValue={onValue}
        />
      );
      await switchTo('Expression');
      expect(lastValue(onValue)[0]).toMatchObject({ mode: 'expression', expression: 'true' });
    });

    it('keeps a host’s own properties on the rule', async () => {
      const onValue = vi.fn();
      render(
        <Harness
          initial={[{ ...conditionsRule('a'), source: 'legacy' } as Rule]}
          onValue={onValue}
        />
      );
      await switchTo('Expression');
      expect(lastValue(onValue)[0]).toMatchObject({ source: 'legacy', mode: 'expression' });
    });

    it('shows a preserved rule read-only, keeping it through an outcome change', async () => {
      const onValue = vi.fn();
      const preserved: PreservedRule = {
        id: 'a',
        outcome: 'show',
        mode: 'preserved',
        preservedSource: '{ "when": "name" }',
      };
      render(<Harness initial={[preserved]} onValue={onValue} allowExpressions={false} />);
      const box = screen.getByRole('textbox', { name: 'Rule 1 Stored conditions' });
      expect(box).toHaveValue('{ "when": "name" }');
      expect(box).toHaveAttribute('readonly');
      expect(box).toHaveAccessibleDescription(
        'These conditions are not supported in the current editor but will continue to execute.'
      );
      expect(toggle()).toHaveAccessibleName('Rule 1 mode: Stored conditions');

      await userEvent.click(screen.getByRole('combobox', { name: 'Rule 1 Outcome' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Hide' }));
      expect(lastValue(onValue)[0]).toEqual({ ...preserved, outcome: 'hide' });
    });

    it('replaces a preserved rule only once the switch is confirmed', async () => {
      const onValue = vi.fn();
      const preserved: PreservedRule = {
        id: 'a',
        outcome: 'show',
        mode: 'preserved',
        preservedSource: '{}',
      };
      render(<Harness initial={[preserved]} onValue={onValue} />);
      await switchTo('Conditions');
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent(
        'These stored conditions cannot be edited here, so they will be removed.'
      );
      await userEvent.click(within(dialog).getByRole('button', { name: 'Switch' }));
      const [rule] = lastValue(onValue);
      expect(rule).toMatchObject({ id: 'a', outcome: 'show', mode: 'conditions' });
      expect(rule).not.toHaveProperty('preservedSource');
    });

    it('forgets that a blank expression was left once the rule switches', async () => {
      render(<Harness initial={[expressionRule('a', '')]} />);
      await userEvent.click(screen.getByRole('textbox', { name: 'Rule 1 Expression' }));
      await userEvent.tab();
      expect(screen.getByText('Enter an expression.')).toBeInTheDocument();
      await switchTo('Conditions');
      await switchTo('Expression');
      expect(screen.queryByText('Enter an expression.')).not.toBeInTheDocument();
    });

    it('returns focus to the mode menu when the dialog closes', async () => {
      render(<Harness initial={[conditionsRule('a', [createCondition({ field: 'name' })])]} />);
      await switchTo('Expression');
      await userEvent.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancel' })
      );
      await waitFor(() => expect(toggle()).toHaveFocus());

      await switchTo('Expression');
      await userEvent.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Switch' })
      );
      await waitFor(() => expect(toggle()).toHaveFocus());
      expect(toggle()).toHaveAccessibleName('Rule 1 mode: Expression');
    });

    it('moves focus into the rule when switching back removes the mode menu', async () => {
      render(<Harness allowExpressions={false} initial={[expressionRule('a', '')]} />);
      await switchTo('Conditions');
      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toHaveFocus()
      );
      expect(screen.queryByRole('button', { name: /^Rule 1 mode: / })).not.toBeInTheDocument();
    });

    it('writes the conditions out through the dialect', async () => {
      const onValue = vi.fn();
      const toExpression = vi.fn(() => 'name === "x"');
      const rule = conditionsRule('a', [
        createCondition({ field: 'name', operator: 'equals', value: 'x' }),
      ]);
      render(<Harness initial={[rule]} dialect={{ toExpression }} onValue={onValue} />);
      await switchTo('Expression');
      expect(toExpression).toHaveBeenCalledWith(
        rule.conditions,
        expect.objectContaining({ fields: FIELDS, valueModes: ['literal', 'expression'] })
      );
      expect(lastValue(onValue)[0]).toMatchObject({
        mode: 'expression',
        expression: 'name === "x"',
      });
    });

    it('asks before dropping conditions the dialect cannot write', async () => {
      const onValue = vi.fn();
      const rule = conditionsRule('a', [createCondition({ field: 'name', value: 'x' })]);
      render(
        <Harness initial={[rule]} dialect={{ toExpression: () => undefined }} onValue={onValue} />
      );
      await switchTo('Expression');
      const dialog = await screen.findByRole('alertdialog', { name: 'Switch to an expression?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(onValue).not.toHaveBeenCalled();
      expect(toggle()).toHaveAccessibleName('Rule 1 mode: Conditions');

      await switchTo('Expression');
      await userEvent.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Switch' })
      );
      expect(lastValue(onValue)[0]).toMatchObject({ mode: 'expression', expression: '' });
    });

    it('asks without a dialect too', async () => {
      render(<Harness initial={[conditionsRule('a', [createCondition({ field: 'name' })])]} />);
      await switchTo('Expression');
      expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    });

    it('reads an expression back into conditions through the dialect', async () => {
      const onValue = vi.fn();
      const conditions = createConditionGroup('any', [
        createCondition({ field: 'amount', operator: 'greaterThan', value: '5' }),
      ]);
      render(
        <Harness
          initial={[expressionRule('a', 'amount > 5')]}
          dialect={{ fromExpression: () => conditions }}
          onValue={onValue}
        />
      );
      await switchTo('Conditions');
      expect(lastValue(onValue)[0]).toEqual({
        id: 'a',
        outcome: 'show',
        mode: 'conditions',
        conditions,
      });
    });

    it('asks before dropping an expression the dialect cannot read, then starts one condition', async () => {
      const onValue = vi.fn();
      render(
        <Harness
          initial={[expressionRule('a', 'f(x)')]}
          dialect={{ fromExpression: () => undefined }}
          onValue={onValue}
        />
      );
      await switchTo('Conditions');
      const dialog = await screen.findByRole('alertdialog', { name: 'Switch to conditions?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Switch' }));
      const [rule] = lastValue(onValue) as ConditionsRule[];
      expect(rule.mode).toBe('conditions');
      expect(rule.conditions.children).toEqual([expect.objectContaining({ kind: 'condition' })]);
      expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toBeInTheDocument();
    });

    it('switches a blank expression back without asking', async () => {
      const onValue = vi.fn();
      render(<Harness initial={[expressionRule('a', '  ')]} onValue={onValue} />);
      await switchTo('Conditions');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(lastValue(onValue)[0].mode).toBe('conditions');
    });

    it('hides the switch without allowExpressions, except on an expression rule', () => {
      render(
        <Harness
          allowExpressions={false}
          initial={[conditionsRule('a'), expressionRule('b', 'x')]}
        />
      );
      expect(screen.queryByRole('button', { name: /^Rule 1 mode: / })).not.toBeInTheDocument();
      expect(toggle(2)).toHaveAccessibleName('Rule 2 mode: Expression');
    });
  });

  describe('expression editor', () => {
    it('edits the expression', async () => {
      const onValue = vi.fn();
      render(<Harness initial={[expressionRule('a', '')]} onValue={onValue} />);
      await userEvent.type(screen.getByRole('textbox', { name: 'Rule 1 Expression' }), 'a');
      expect(lastValue(onValue)[0]).toMatchObject({ expression: 'a' });
    });

    it('flags a blank expression once focus leaves it', async () => {
      render(<Harness initial={[expressionRule('a', '')]} />);
      const box = screen.getByRole('textbox', { name: 'Rule 1 Expression' });
      expect(box).not.toHaveAttribute('aria-invalid');
      await userEvent.click(box);
      await userEvent.tab();
      expect(box).toHaveAttribute('aria-invalid', 'true');
      expect(box).toHaveAccessibleErrorMessage('Enter an expression.');
    });

    it('flags blank expressions straight away with forceErrors or defaultTouched', () => {
      const { rerender } = render(<Harness initial={[expressionRule('a', '')]} forceErrors />);
      expect(screen.getByText('Enter an expression.')).toBeInTheDocument();
      rerender(<Harness key="again" initial={[expressionRule('a', '')]} defaultTouched={['a']} />);
      expect(screen.getByText('Enter an expression.')).toBeInTheDocument();
    });

    it('flags an expression the dialect cannot run: at once when it opens so, after leaving it when typed', async () => {
      const dialect = {
        checkExpression: (rule: ExpressionRule) =>
          rule.expression.includes('(') ? ('invalid' as const) : undefined,
      };
      const { unmount } = render(
        <Harness initial={[expressionRule('a', 'f(x)')]} dialect={dialect} />
      );
      expect(
        screen.getByRole('textbox', { name: 'Rule 1 Expression' })
      ).toHaveAccessibleErrorMessage(
        "This expression can't run. Check its syntax and what it uses."
      );
      unmount();

      render(<Harness initial={[expressionRule('a', 'x')]} dialect={dialect} />);
      const box = screen.getByRole('textbox', { name: 'Rule 1 Expression' });
      await userEvent.type(box, '(');
      expect(box).not.toHaveAttribute('aria-invalid');
      await userEvent.tab();
      expect(box).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders the host’s editor with the wiring it needs', async () => {
      const onValue = vi.fn();
      const renderExpressionEditor = vi.fn((props: RuleExpressionEditorProps) => (
        <input
          id={props.id}
          aria-labelledby={props.labelledBy}
          aria-invalid={props.invalid}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          onBlur={props.onBlur}
        />
      ));
      render(
        <Harness
          initial={[expressionRule('a', 'x')]}
          renderExpressionEditor={renderExpressionEditor}
          onValue={onValue}
        />
      );
      const box = screen.getByRole('textbox', { name: 'Rule 1 Expression' });
      expect(box.tagName).toBe('INPUT');
      expect(renderExpressionEditor).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'x', disabled: false, invalid: false })
      );
      await userEvent.type(box, 'y');
      expect(lastValue(onValue)[0]).toMatchObject({ expression: 'xy' });
    });

    it('marks the host’s editor left on its blur, and hands it the message id', async () => {
      const renderExpressionEditor = (props: RuleExpressionEditorProps) => (
        <input
          id={props.id}
          aria-labelledby={props.labelledBy}
          aria-invalid={props.invalid}
          aria-errormessage={props.errorId}
          onBlur={props.onBlur}
        />
      );
      render(
        <Harness
          initial={[expressionRule('a', '')]}
          renderExpressionEditor={renderExpressionEditor}
        />
      );
      const box = screen.getByRole('textbox', { name: 'Rule 1 Expression' });
      await userEvent.click(box);
      await userEvent.tab();
      expect(box).toHaveAttribute('aria-invalid', 'true');
      expect(box).toHaveAccessibleErrorMessage('Enter an expression.');
    });

    it('keeps the built-in editor when the host returns undefined', () => {
      render(
        <Harness initial={[expressionRule('a', 'x')]} renderExpressionEditor={() => undefined} />
      );
      expect(screen.getByRole('textbox', { name: 'Rule 1 Expression' }).tagName).toBe('TEXTAREA');
    });
  });

  it('flags a new rule whose default outcome the editor does not offer', async () => {
    render(<Harness initial={[]} defaultOutcome="archive" />);
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveAccessibleErrorMessage(
      'Select an outcome.'
    );
  });

  it('flags an outcome the editor does not offer', () => {
    render(<Harness initial={[{ ...conditionsRule('a'), outcome: 'archive' }]} />);
    const outcome = screen.getByRole('combobox', { name: 'Rule 1 Outcome' });
    expect(outcome).toHaveTextContent('Select an outcome');
    expect(outcome).toHaveAccessibleErrorMessage('Select an outcome.');
  });

  it('disables every control', () => {
    render(<Harness disabled initial={[conditionsRule('a'), expressionRule('b', 'x')]} />);
    for (const name of ['Rule 1 Outcome', 'Condition 1 Field']) {
      expect(screen.getByRole('combobox', { name })).toBeDisabled();
    }
    expect(screen.getByRole('textbox', { name: 'Rule 2 Expression' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove rule 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add rule' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rule 1 mode: Conditions' })).toBeDisabled();
  });

  it('uses the host’s strings', () => {
    render(
      <Harness
        initial={[conditionsRule('a')]}
        strings={{
          ruleName: (n) => `Règle ${n}`,
          outcomeLabel: 'Résultat',
          modeConditions: 'Critères',
          ruleMode: (rule, mode) => `${rule}, mode : ${mode}`,
          addRule: 'Ajouter une règle',
        }}
        conditionsStrings={{ fieldLabel: 'Champ', conditionName: (n) => `Critère ${n}` }}
      />
    );
    expect(screen.getByRole('combobox', { name: 'Règle 1 Résultat' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Critère 1 Champ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Règle 1, mode : Critères' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter une règle' })).toBeInTheDocument();
  });

  it('says a rule without conditions applies always, in place of when', async () => {
    const { container, unmount } = render(
      <Harness initial={[conditionsRule('a', [])]} conditionsStrings={{ empty: 'Aucune.' }} />
    );
    expect(screen.getByText('always')).toBeInTheDocument();
    expect(screen.queryByText('when')).toBeNull();
    // The header says it, so the conditions' own empty text and guide line do not show.
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('.border-l-2')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(screen.getByText('when')).toBeInTheDocument();
    expect(container.querySelector('.border-l-2')).not.toBeNull();
    unmount();

    render(<Harness initial={[conditionsRule('a', [])]} strings={{ always: 'toujours' }} />);
    expect(screen.getByText('toujours')).toBeInTheDocument();
  });
});
