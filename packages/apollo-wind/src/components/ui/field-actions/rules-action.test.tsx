import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ConditionField } from '@/components/ui/conditions-editor';
import { createCondition, createConditionGroup } from '@/components/ui/conditions-editor';
import { QuickFormField } from '@/components/ui/quick-form-field';
import { createRule, type Rule, type RuleOutcome } from '@/components/ui/rules-editor';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RulesAction } from './rules-action';

const FIELDS: ConditionField[] = [{ value: 'name', label: 'Name', type: 'string' }];
const OUTCOMES: RuleOutcome[] = [
  { value: 'show', label: 'Show' },
  { value: 'hide', label: 'Hide' },
  { value: 'require', label: 'Require' },
];
const RULE = createRule({ id: 'rule-1', outcome: 'show', expression: 'name === "Ada"' });
const ALWAYS_REQUIRED = createRule({
  id: 'required',
  outcome: 'require',
  conditions: createConditionGroup('all', []),
});
const LATER = createRule({ id: 'rule-2', outcome: 'hide', expression: 'name === "Bo"' });

type Props = Partial<ComponentProps<typeof RulesAction>>;

function Harness({ initial = [], ...props }: Props & { initial?: Rule[] }) {
  const [value, setValue] = useState(initial);
  return (
    <TooltipProvider>
      <RulesAction
        fields={FIELDS}
        outcomes={OUTCOMES}
        {...props}
        value={value}
        onChange={(next) => {
          setValue(next);
          props.onChange?.(next);
        }}
      />
    </TooltipProvider>
  );
}

describe('RulesAction', () => {
  it('counts the rules on its trigger', () => {
    const { unmount } = render(<Harness />);
    expect(screen.getByRole('button', { name: 'Field rules' })).toBeInTheDocument();
    unmount();

    render(<Harness initial={[RULE, ALWAYS_REQUIRED]} requiredOutcome="require" />);
    expect(screen.getByRole('button', { name: 'Field rules (2)' })).toHaveTextContent('2');
  });

  it('opens the rules editor, named by its title', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} strings={{ title: 'Behavior' }} />);

    await user.click(screen.getByRole('button', { name: 'Field rules' }));
    expect(screen.getByRole('dialog', { name: 'Behavior' })).toBeInTheDocument();
    expect(screen.getByText('No rules.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ outcome: 'show' })]);
  });

  it('offers the Required switch only with requiredOutcome', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[ALWAYS_REQUIRED]} />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1)' }));
    expect(screen.queryByRole('switch', { name: 'Required field' })).toBeNull();
    // Without the switch, the rule is a card like any other.
    expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveTextContent('Require');
  });

  it('shows a required rule with no conditions as the switch, in place of an empty list', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[ALWAYS_REQUIRED]} requiredOutcome="require" />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1)' }));
    expect(screen.getByRole('switch', { name: 'Required field' })).toBeChecked();
    expect(screen.queryByRole('combobox', { name: 'Rule 1 Outcome' })).toBeNull();
    expect(screen.queryByText('No rules.')).toBeNull();
  });

  it('adds the rule first when switched on, and removes it when switched off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={[RULE]} requiredOutcome="require" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1)' }));

    await user.click(screen.getByRole('switch', { name: 'Required field' }));
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        outcome: 'require',
        conditions: expect.objectContaining({ children: [] }),
      }),
      RULE,
    ]);

    await user.click(screen.getByRole('switch', { name: 'Required field' }));
    expect(onChange).toHaveBeenLastCalledWith([RULE]);
  });

  it('turns the switch into a rule with a condition to fill in', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={[ALWAYS_REQUIRED]} requiredOutcome="require" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1)' }));

    await user.click(screen.getByRole('button', { name: 'Make conditional' }));
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        id: 'required',
        conditions: expect.objectContaining({
          children: [expect.objectContaining({ kind: 'condition' })],
        }),
      }),
    ]);
    // The rule now says when the field is required, so the switch steps aside.
    expect(screen.queryByRole('switch', { name: 'Required field' })).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveTextContent('Require');
    expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toHaveFocus();
  });

  it('hides the switch while a rule requires the field on conditions', async () => {
    const user = userEvent.setup();
    const onConditions = createRule({
      id: 'when',
      outcome: 'require',
      expression: 'name === "Ada"',
    });
    render(<Harness initial={[onConditions]} requiredOutcome="require" />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1)' }));
    expect(screen.queryByRole('switch', { name: 'Required field' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Remove rule 1' }));
    expect(screen.getByRole('switch', { name: 'Required field' })).not.toBeChecked();
  });

  it('keeps the switch while it is on, beside a rule that requires on conditions', async () => {
    const user = userEvent.setup();
    const onConditions = createRule({
      id: 'when',
      outcome: 'require',
      expression: 'name === "Ada"',
    });
    render(<Harness initial={[ALWAYS_REQUIRED, onConditions]} requiredOutcome="require" />);
    await user.click(screen.getByRole('button', { name: 'Field rules (2)' }));
    expect(screen.getByRole('switch', { name: 'Required field' })).toBeChecked();
  });

  it("keeps the switch's rule in its place when the others change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initial={[RULE, ALWAYS_REQUIRED, LATER]}
        requiredOutcome="require"
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Field rules (3)' }));
    await user.click(screen.getByRole('button', { name: 'Remove rule 2' }));
    expect(onChange).toHaveBeenLastCalledWith([RULE, ALWAYS_REQUIRED]);

    // Removing a rule before it keeps it before the rest.
    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    await user.click(screen.getByRole('button', { name: 'Remove rule 1' }));
    expect(onChange).toHaveBeenLastCalledWith([
      ALWAYS_REQUIRED,
      expect.objectContaining({ outcome: 'show' }),
    ]);
  });

  it('turns red and says how many rules need attention, showing their messages on open', async () => {
    const user = userEvent.setup();
    const removed = createRule({
      id: 'removed',
      outcome: 'show',
      conditions: createConditionGroup('all', [
        createCondition({ id: 'removed-1', field: 'region', operator: 'equals', value: 'EU' }),
      ]),
    });
    render(<Harness initial={[RULE, removed]} />);
    const trigger = screen.getByRole('button', { name: 'Field rules (2), 1 needs attention' });
    expect(trigger).toHaveClass('text-destructive');
    await user.click(trigger);
    expect(
      screen.getByText('The form does not contain region. Select another field.')
    ).toBeInTheDocument();
  });

  it('follows the fields: a rule on a removed field needs attention, flagged when next opened', async () => {
    const user = userEvent.setup();
    const onName = createRule({
      id: 'on-name',
      outcome: 'show',
      conditions: createConditionGroup('all', [
        createCondition({ id: 'on-name-1', field: 'name', operator: 'equals', value: 'Ada' }),
      ]),
    });
    const { rerender } = render(<Harness initial={[onName]} />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1)' }));
    await user.keyboard('{Escape}');
    const other: ConditionField[] = [{ value: 'other', label: 'Other', type: 'string' }];
    rerender(<Harness initial={[onName]} fields={other} />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1), 1 needs attention' }));
    expect(
      screen.getByText('The form does not contain name. Select another field.')
    ).toBeInTheDocument();
  });

  it('flags a rule added while open only once it is left', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Field rules' }));
    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(screen.queryByText('Select a field and enter a value.')).toBeNull();
    // Still needing attention, so the trigger says so.
    expect(
      screen.getByRole('button', { name: 'Field rules (1), 1 needs attention' })
    ).toBeInTheDocument();
  });

  it('words its trigger, title, switch and Make conditional from strings', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[ALWAYS_REQUIRED]}
        requiredOutcome="require"
        strings={{
          trigger: (count, issues) => `Regeln: ${count}, ${issues}`,
          title: 'Feldregeln',
          required: 'Pflichtfeld',
          makeConditional: 'Bedingt machen',
        }}
        editorStrings={{ addRule: 'Regel hinzufügen' }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Regeln: 1, 0' }));
    expect(screen.getByRole('dialog', { name: 'Feldregeln' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Pflichtfeld' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bedingt machen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regel hinzufügen' })).toBeInTheDocument();
  });

  it('is disabled with disabled, or inside a disabled QuickFormField', () => {
    const { unmount } = render(<Harness disabled />);
    expect(screen.getByRole('button', { name: 'Field rules' })).toBeDisabled();
    unmount();

    render(
      <QuickFormField
        disabled
        headerActions={
          <RulesAction value={[]} onChange={vi.fn()} fields={FIELDS} outcomes={OUTCOMES} />
        }
      />
    );
    expect(screen.getByRole('button', { name: 'Field rules' })).toBeDisabled();
  });
});
