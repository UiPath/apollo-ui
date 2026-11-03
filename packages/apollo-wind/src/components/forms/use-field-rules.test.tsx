import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RulesAction } from '@/components/ui/field-actions';
import { RulesEditor } from '@/components/ui/rules-editor';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { FieldRuleOutcome, FieldRulesOptions } from './field-rules';
import type { FieldRule } from './form-schema';
import {
  type FieldRuleField,
  rulesEngineDialect,
  rulesEngineVocabulary,
} from './rules-engine-dialect';
import { useFieldRules } from './use-field-rules';

const FIELDS: FieldRuleField[] = [
  { value: 'name', label: 'Name', type: 'string' },
  { value: 'amount', label: 'Amount', type: 'number' },
];
const OUTCOMES: FieldRuleOutcome[] = [
  { value: 'show', label: 'Show', effects: { visible: true } },
  { value: 'require', label: 'Require', effects: { required: true } },
];
const OPTIONS: FieldRulesOptions = { outcomes: OUTCOMES, fields: FIELDS };

const REPLACEMENT: FieldRule[] = [
  {
    id: 'new',
    conditions: [{ when: 'amount', is: 3 }],
    operator: 'AND',
    effects: { required: true },
  },
];

/** A host that writes on every change, as hitl does. */
function Host({
  initial,
  onStored,
  options = OPTIONS,
}: {
  initial: FieldRule[];
  onStored?: (rules: FieldRule[]) => void;
  options?: FieldRulesOptions;
}) {
  const [stored, setStored] = useState(initial);
  const editor = useFieldRules(
    { rules: stored },
    ({ rules }) => {
      setStored(rules);
      onStored?.(rules);
    },
    options
  );
  return (
    <>
      <button type="button" onClick={() => setStored(REPLACEMENT)}>
        Replace
      </button>
      <RulesEditor
        label="Rules"
        outcomes={OUTCOMES}
        fields={FIELDS}
        operators={rulesEngineVocabulary.operators}
        valueModes={rulesEngineVocabulary.valueModes}
        dialect={rulesEngineDialect}
        value={editor.value}
        onChange={editor.onChange}
      />
    </>
  );
}

async function choose(trigger: HTMLElement, option: string) {
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('useFieldRules', () => {
  it('keeps a blank row in the editor while storing only finished conditions', async () => {
    const onStored = vi.fn();
    render(<Host initial={[]} onStored={onStored} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    // The new rule's row is blank, so nothing is stored, yet the row stays.
    expect(onStored).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toBeInTheDocument();

    await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'Name');
    const value = screen.getByRole('textbox', { name: 'Condition 1 Value' });
    await userEvent.type(value, 'Ada');
    // Typing keeps focus: the row is not rebuilt from the stored rules.
    expect(value).toHaveFocus();
    expect(onStored).toHaveBeenLastCalledWith([
      expect.objectContaining({
        conditions: [{ when: 'name', is: 'Ada' }],
        effects: { visible: true },
      }),
    ]);
  });

  it('writes untouched rules back as the stored objects', async () => {
    const onStored = vi.fn();
    const initial: FieldRule[] = [
      {
        id: 'a',
        conditions: [{ when: 'name', is: 'x' }],
        operator: 'AND',
        effects: { visible: true },
      },
      { id: 'b', conditions: [], operator: 'AND', effects: { visible: true } },
    ];
    render(<Host initial={initial} onStored={onStored} />);
    await choose(screen.getByRole('combobox', { name: 'Rule 2 Outcome' }), 'Require');
    const [first, second] = onStored.mock.lastCall?.[0] ?? [];
    expect(first).toBe(initial[0]);
    expect(second).toMatchObject({ id: 'b', effects: { required: true } });
  });

  it('reads the stored rules again when they change from outside', async () => {
    render(<Host initial={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveTextContent('Require');
    expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toHaveTextContent('Amount');
  });

  it('keeps edits when the host passes the stored rules back late, or out of order', async () => {
    function LateHost() {
      const [stored, setStored] = useState<FieldRule[]>([]);
      const [pending, setPending] = useState<FieldRule[][]>([]);
      const editor = useFieldRules(
        { rules: stored },
        ({ rules }) => setPending((list) => [...list, rules]),
        OPTIONS
      );
      return (
        <>
          <button type="button" onClick={() => setStored(pending[0])}>
            Save first
          </button>
          <RulesEditor
            label="Rules"
            outcomes={OUTCOMES}
            fields={FIELDS}
            operators={rulesEngineVocabulary.operators}
            valueModes={rulesEngineVocabulary.valueModes}
            value={editor.value}
            onChange={editor.onChange}
          />
        </>
      );
    }
    render(<LateHost />);
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    // The host has not passed anything back yet, and the new rule stays.
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'Name');
    // The first write, with a blank row and so no stored rule, arrives after the second edit.
    await userEvent.click(screen.getByRole('button', { name: 'Save first' }));
    expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toHaveTextContent('Name');
  });

  it('writes with the latest options', async () => {
    const onStored = vi.fn();
    const initial: FieldRule[] = [
      { id: 'a', conditions: [], operator: 'AND', effects: { visible: true } },
    ];
    const { rerender } = render(<Host initial={initial} onStored={onStored} />);
    const outcomes = OUTCOMES.map((outcome) =>
      outcome.value === 'require'
        ? { ...outcome, effects: { required: true, visible: true } }
        : outcome
    );
    rerender(<Host initial={initial} onStored={onStored} options={{ ...OPTIONS, outcomes }} />);
    await choose(screen.getByRole('combobox', { name: 'Rule 1 Outcome' }), 'Require');
    expect(onStored).toHaveBeenLastCalledWith([
      expect.objectContaining({ effects: { required: true, visible: true } }),
    ]);
  });

  it('switches a rule to an expression through the dialect, and stores it', async () => {
    const onStored = vi.fn();
    render(
      <Host
        onStored={onStored}
        initial={[
          {
            id: 'a',
            conditions: [
              { when: 'name', is: 'Ada' },
              { when: 'amount', custom: 'amount > 2' },
            ],
            operator: 'OR',
            effects: { visible: true },
          },
        ]}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Rule 1 mode: Conditions' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /^Expression/ }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Rule 1 Expression' })).toHaveValue(
      'name === "Ada" || amount > 2'
    );
    expect(onStored).toHaveBeenLastCalledWith([
      expect.objectContaining({
        conditions: [{ when: '', custom: 'name === "Ada" || amount > 2' }],
        operator: 'AND',
      }),
    ]);
  });

  it('stores a rule that applied always as before while its first condition is filled in', async () => {
    const onStored = vi.fn();
    const always: FieldRule = {
      id: 'a',
      conditions: [],
      operator: 'AND',
      effects: { visible: true },
    };
    render(<Host initial={[always]} onStored={onStored} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(onStored).toHaveBeenLastCalledWith([always]);
    await userEvent.click(screen.getByRole('button', { name: 'Remove condition 1' }));
    // Without the condition it still applies always, and a later first condition waits again.
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(onStored).toHaveBeenLastCalledWith([always]);
  });

  it('forgets which rules applied always when the stored rules change from outside', async () => {
    const onStored = vi.fn();
    const always: FieldRule = {
      id: 'new',
      conditions: [],
      operator: 'AND',
      effects: { required: true },
    };
    render(<Host initial={[always]} onStored={onStored} />);
    // The same rule, now with a condition, from outside.
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'Condition 1 Value' }));
    expect(onStored).toHaveBeenLastCalledWith([]);
  });

  describe('the required flag', () => {
    const REQUIRED_OPTIONS: FieldRulesOptions = { ...OPTIONS, requiredOutcome: 'require' };

    /** A host that keeps `required` apart from the rules, as hitl does. */
    function FlagHost({
      initial,
      onStored,
      options = REQUIRED_OPTIONS,
    }: {
      initial: { rules?: FieldRule[]; required?: boolean };
      onStored?: (next: { rules: FieldRule[]; required: boolean }) => void;
      options?: FieldRulesOptions;
    }) {
      const [stored, setStored] = useState(initial);
      const editor = useFieldRules(
        stored,
        (next) => {
          setStored(next);
          onStored?.(next);
        },
        options
      );
      return (
        <>
          <button
            type="button"
            onClick={() => setStored((current) => ({ ...current, required: !current.required }))}
          >
            Toggle required
          </button>
          <RulesEditor
            label="Rules"
            outcomes={OUTCOMES}
            fields={FIELDS}
            operators={rulesEngineVocabulary.operators}
            valueModes={rulesEngineVocabulary.valueModes}
            value={editor.value}
            onChange={editor.onChange}
          />
        </>
      );
    }

    it('reads the flag as a rule with no conditions, first', () => {
      render(<FlagHost initial={{ rules: REPLACEMENT, required: true }} />);
      expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveTextContent('Require');
      expect(screen.getByText('always')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Rule 2 Outcome' })).toBeInTheDocument();
    });

    it('writes that rule back as the flag, in the same call as the rules', async () => {
      const onStored = vi.fn();
      render(<FlagHost initial={{ required: true }} onStored={onStored} />);
      await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
      expect(onStored).toHaveBeenLastCalledWith({ rules: [], required: true });
      // The blank new rule stays, though nothing of it is stored.
      expect(screen.getByRole('combobox', { name: 'Rule 2 Outcome' })).toBeInTheDocument();

      await choose(screen.getByRole('combobox', { name: 'Rule 1 Outcome' }), 'Show');
      expect(onStored).toHaveBeenLastCalledWith({
        rules: [expect.objectContaining({ conditions: [], effects: { visible: true } })],
        required: false,
      });
    });

    it('keeps the field required while its first condition is filled in', async () => {
      const onStored = vi.fn();
      render(<FlagHost initial={{ required: true }} onStored={onStored} />);
      await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
      expect(onStored).toHaveBeenLastCalledWith({ rules: [], required: true });

      await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'Name');
      expect(onStored).toHaveBeenLastCalledWith({ rules: [], required: true });
      await userEvent.type(screen.getByRole('textbox', { name: 'Condition 1 Value' }), 'Ada');
      expect(onStored).toHaveBeenLastCalledWith({
        rules: [
          expect.objectContaining({
            conditions: [{ when: 'name', is: 'Ada' }],
            effects: { required: true },
          }),
        ],
        required: false,
      });
    });

    it('reads the flag again when it changes from outside', async () => {
      render(<FlagHost initial={{ rules: [], required: false }} />);
      expect(screen.getByText('No rules.')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Toggle required' }));
      expect(screen.getByRole('combobox', { name: 'Rule 1 Outcome' })).toHaveTextContent('Require');
    });

    it('passes the flag through, unread, without requiredOutcome', async () => {
      const onStored = vi.fn();
      render(<FlagHost initial={{ required: true }} onStored={onStored} options={OPTIONS} />);
      expect(screen.getByText('No rules.')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
      expect(onStored).toHaveBeenLastCalledWith({ rules: [], required: true });
    });
  });

  it('lists nothing for a preserved rule, which runs as stored though its text would not', () => {
    const stored: FieldRule[] = [
      {
        id: 'pattern',
        conditions: [
          { when: 'name', matches: 'a.b' },
          { when: '', custom: 'amount * 2 > 1' },
        ],
        operator: 'AND',
        effects: { visible: true },
      },
    ];
    const { result } = renderHook(() => useFieldRules({ rules: stored }, vi.fn(), OPTIONS));
    expect(result.current.value[0]).toMatchObject({ mode: 'preserved' });
    expect(result.current.issues).toEqual([]);
  });

  it('flags a row whose Expression value names a field the form no longer has', async () => {
    const user = userEvent.setup();
    const limit: FieldRuleField = { value: 'limit', label: 'Limit', type: 'number' };
    const stored: FieldRule[] = [
      {
        id: 'cap',
        conditions: [{ when: 'amount', custom: 'amount > limit' }],
        operator: 'AND',
        effects: { visible: true },
      },
    ];
    function ActionHost({ fields }: { fields: FieldRuleField[] }) {
      const options = { ...OPTIONS, fields };
      const editor = useFieldRules({ rules: stored }, vi.fn(), options);
      return (
        <TooltipProvider>
          <RulesAction
            outcomes={OUTCOMES}
            fields={fields}
            operators={rulesEngineVocabulary.operators}
            valueModes={rulesEngineVocabulary.valueModes}
            dialect={rulesEngineDialect}
            value={editor.value}
            onChange={editor.onChange}
          />
        </TooltipProvider>
      );
    }
    const { rerender } = render(<ActionHost fields={[...FIELDS, limit]} />);
    expect(screen.getByRole('button', { name: 'Field rules (1)' })).toBeInTheDocument();
    rerender(<ActionHost fields={FIELDS} />);
    await user.click(screen.getByRole('button', { name: 'Field rules (1), 1 needs attention' }));
    expect(screen.getByText('Uses limit, which the form does not contain.')).toBeInTheDocument();
  });

  it('lists what needs attention in the rules, such as a removed field', async () => {
    const stored: FieldRule[] = [
      { id: 'removed', conditions: [{ when: 'region', is: 'EU' }], operator: 'AND', effects: {} },
      {
        id: 'expression',
        conditions: [{ when: '', custom: 'region === "EU"' }],
        operator: 'AND',
        effects: { visible: true },
      },
      {
        id: 'fine',
        conditions: [{ when: 'amount', is: 1 }],
        operator: 'AND',
        effects: { visible: true },
      },
    ];
    const { result, rerender } = renderHook(
      ({ options }) => useFieldRules({ rules: stored }, vi.fn(), options),
      { initialProps: { options: OPTIONS } }
    );
    expect(result.current.issues).toEqual([
      { ruleId: 'removed', kind: 'outcome' },
      { ruleId: 'removed', nodeId: 'removed-condition-0', kind: 'unknownField' },
      { ruleId: 'expression', kind: 'unknownField' },
    ]);
    // Following the fields as they change.
    rerender({ options: { ...OPTIONS, fields: FIELDS.filter((f) => f.value !== 'amount') } });
    expect(result.current.issues).toContainEqual({
      ruleId: 'fine',
      nodeId: 'fine-condition-0',
      kind: 'unknownField',
    });
  });
});
