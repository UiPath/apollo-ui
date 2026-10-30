import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RulesEditor } from '@/components/ui/rules-editor';
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
}: {
  initial: FieldRule[];
  onStored?: (rules: FieldRule[]) => void;
}) {
  const [stored, setStored] = useState(initial);
  const editor = useFieldRules(
    stored,
    (next) => {
      setStored(next);
      onStored?.(next);
    },
    OPTIONS
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
});
