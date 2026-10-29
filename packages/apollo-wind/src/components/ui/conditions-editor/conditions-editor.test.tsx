import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputGroupInput } from '@/components/ui/input-group';
import { ConditionsEditor, type ConditionsEditorProps } from './conditions-editor';
import {
  type ConditionGroup,
  createCondition,
  createConditionGroup,
  removeNode,
  updateNode,
} from './model';
import { isConditionComplete } from './status';
import { type ConditionField, DEFAULT_CONDITION_OPERATORS } from './vocabulary';

const FIELDS: ConditionField[] = [
  { value: 'name', label: 'Name', type: 'string' },
  { value: 'due', label: 'Due', type: 'date' },
  { value: 'amount', label: 'Amount', type: 'number' },
  {
    value: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
];

function Harness({
  initial,
  onValue,
  ...props
}: Partial<ConditionsEditorProps> & {
  initial: ConditionGroup;
  onValue?: (value: ConditionGroup) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ConditionsEditor
      label="Conditions"
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

async function choose(trigger: HTMLElement, option: string) {
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

const lastCondition = (spy: ReturnType<typeof vi.fn>) => spy.mock.lastCall?.[0].children[0];

describe('ConditionsEditor', () => {
  it('names every control by its own row’s labels', () => {
    render(
      <Harness
        initial={createConditionGroup('all', [
          createCondition({ field: 'name', value: 'Ada' }),
          createCondition(),
        ])}
      />
    );
    expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Condition 1 Operator' })).toHaveTextContent(
      'Equals'
    );
    expect(screen.getByRole('textbox', { name: 'Condition 1 Value' })).toHaveValue('Ada');
    expect(screen.getByRole('combobox', { name: 'Condition 2 Field' })).toBeInTheDocument();
    // One set of labels: each row has its own, and the one-line layout only hides later rows'.
    expect(screen.getAllByText('Field')).toHaveLength(2);
  });

  it('hides only later rows’ labels on one line, and separates adjacent rows', () => {
    render(
      <Harness
        initial={createConditionGroup('all', [
          createCondition(),
          createConditionGroup('any', [createCondition(), createCondition()]),
          createCondition(),
        ])}
      />
    );
    const rows = screen
      .getAllByRole('group')
      .filter((group) => group.hasAttribute('data-condition-row'));
    expect(rows).toHaveLength(4);
    // Rows follow one another only within a group, so each group's first row heads its columns.
    const later = rows.filter((row) => row.matches('[data-condition-row]~[data-condition-row]'));
    expect(later.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Condition 3',
      'Condition 4',
    ]);
    // A separator sits only between two condition rows, not between a row and a group.
    const separated = rows.filter((row) =>
      row.previousElementSibling?.hasAttribute('data-condition-separator')
    );
    expect(separated.map((row) => row.getAttribute('aria-label'))).toEqual(['Condition 3']);
    expect(document.querySelectorAll('[data-condition-separator]')).toHaveLength(1);
    for (const label of within(rows[0]).getAllByText(/^(Field|Operator|Value)$/)) {
      expect(label.className).toContain(
        '@lg:in-[[data-condition-row]~[data-condition-row]]:sr-only'
      );
    }
  });

  it("offers the field type's operators, and resets the operator and value on a type change", async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [createCondition({ field: 'name', value: 'Ada' })])}
      />
    );
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'Amount');
    expect(lastCondition(onValue)).toMatchObject({
      field: 'amount',
      operator: 'equals',
      value: '',
    });
    await userEvent.click(screen.getByRole('combobox', { name: 'Condition 1 Operator' }));
    expect(await screen.findByRole('option', { name: 'Greater than' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Contains' })).toBeNull();
  });

  it('keeps the value when the new field has the same type', async () => {
    const fields: ConditionField[] = [...FIELDS, { value: 'city', label: 'City', type: 'string' }];
    const onValue = vi.fn();
    render(
      <Harness
        fields={fields}
        onValue={onValue}
        initial={createConditionGroup('all', [
          createCondition({ field: 'name', operator: 'contains', value: 'a' }),
        ])}
      />
    );
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'City');
    expect(lastCondition(onValue)).toMatchObject({
      field: 'city',
      operator: 'contains',
      value: 'a',
    });
  });

  it('hides the value for an operator that takes none', () => {
    render(
      <Harness
        initial={createConditionGroup('all', [
          createCondition({ field: 'name', operator: 'isEmpty' }),
        ])}
      />
    );
    expect(screen.queryByRole('textbox', { name: 'Condition 1 Value' })).toBeNull();
  });

  it('takes several options for a multiple operator', () => {
    render(
      <Harness
        initial={createConditionGroup('all', [
          createCondition({ field: 'status', operator: 'isOneOf', values: ['open'] }),
        ])}
      />
    );
    expect(screen.getByLabelText('Condition 1 Value')).toHaveTextContent('Open');
  });

  describe('value modes', () => {
    const operators = {
      ...DEFAULT_CONDITION_OPERATORS,
      string: [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains', valueModes: ['literal'] as const },
      ],
    };

    it('clears the value when switching mode, and keeps it when reselecting the current one', async () => {
      const onValue = vi.fn();
      render(
        <Harness
          onValue={onValue}
          initial={createConditionGroup('all', [createCondition({ field: 'name', value: 'Ada' })])}
        />
      );
      const menu = screen.getByRole('button', { name: 'Condition 1 Value mode: Fixed value' });
      await userEvent.click(menu);
      await userEvent.click(await screen.findByRole('menuitemradio', { name: /Fixed value/ }));
      expect(onValue).not.toHaveBeenCalled();
      await userEvent.click(menu);
      await userEvent.click(await screen.findByRole('menuitemradio', { name: /Expression/ }));
      expect(lastCondition(onValue)).toMatchObject({ valueMode: 'expression', value: '' });
      expect(
        screen.getByRole('button', { name: 'Condition 1 Value mode: Expression' })
      ).toBeInTheDocument();
    });

    it('resets to a mode the new operator allows, never the other way round', async () => {
      const onValue = vi.fn();
      render(
        <Harness
          operators={operators}
          onValue={onValue}
          initial={createConditionGroup('all', [
            createCondition({ field: 'name', valueMode: 'expression', value: 'other' }),
          ])}
        />
      );
      await userEvent.click(screen.getByRole('combobox', { name: 'Condition 1 Operator' }));
      // Every operator stays listed whatever the mode.
      await userEvent.click(await screen.findByRole('option', { name: 'Contains' }));
      expect(lastCondition(onValue)).toMatchObject({
        operator: 'contains',
        valueMode: 'literal',
        value: '',
      });
    });

    it('lists a mode the operator rules out as disabled, saying why', async () => {
      render(
        <Harness
          operators={operators}
          initial={createConditionGroup('all', [
            createCondition({ field: 'name', operator: 'contains' }),
          ])}
        />
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Condition 1 Value mode: Fixed value' })
      );
      const expression = await screen.findByRole('menuitemradio', { name: /Expression/ });
      expect(expression).toHaveAttribute('aria-disabled', 'true');
      expect(expression).toHaveTextContent('Not available with Contains');
    });

    it('offers Variable only with variables, and hides the menu with one mode', async () => {
      const initial = createConditionGroup('all', [createCondition({ field: 'name' })]);
      const { unmount } = render(<Harness initial={initial} valueModes={['literal']} />);
      expect(screen.queryByRole('button', { name: /mode:/ })).toBeNull();
      unmount();
      render(<Harness initial={initial} variables={[{ id: 'a', label: 'a', value: '$vars.a' }]} />);
      await userEvent.click(screen.getByRole('button', { name: /mode:/ }));
      expect(await screen.findByRole('menuitemradio', { name: /Variable/ })).toBeInTheDocument();
    });

    it('binds a variable in Variable mode', async () => {
      const onValue = vi.fn();
      render(
        <Harness
          onValue={onValue}
          variables={[{ id: 'owner', label: 'owner', value: '$vars.owner' }]}
          initial={createConditionGroup('all', [
            createCondition({ field: 'name', valueMode: 'variable' }),
          ])}
        />
      );
      await userEvent.click(screen.getByLabelText('Condition 1 Value'));
      await userEvent.click(await screen.findByText('owner'));
      expect(lastCondition(onValue)).toMatchObject({ valueMode: 'variable', value: '$vars.owner' });
    });

    it("renders the host's control in place of the built-in one", async () => {
      const onValue = vi.fn();
      render(
        <Harness
          onValue={onValue}
          initial={createConditionGroup('all', [
            createCondition({ field: 'name', valueMode: 'expression', value: 'a' }),
          ])}
          renderValue={({ mode, condition, labelledBy, onChange }) =>
            mode === 'expression' ? (
              <InputGroupInput
                data-testid="host"
                aria-labelledby={labelledBy}
                value={condition.value}
                onChange={(event) => onChange({ value: event.target.value })}
              />
            ) : undefined
          }
        />
      );
      await userEvent.type(screen.getByTestId('host'), 'b');
      expect(lastCondition(onValue)).toMatchObject({ value: 'ab' });
    });
  });

  describe('validation', () => {
    it('shows nothing until focus leaves the row', async () => {
      render(
        <>
          <Harness initial={createConditionGroup('all', [createCondition()])} />
          <button type="button">Elsewhere</button>
        </>
      );
      expect(screen.queryByText('Select a field and enter a value.')).toBeNull();
      await userEvent.click(screen.getByRole('textbox', { name: 'Condition 1 Value' }));
      await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
      expect(screen.getByText('Select a field and enter a value.')).toBeInTheDocument();
      expect(
        screen.getByText('Some conditions are incomplete and will be ignored.')
      ).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toHaveAttribute(
        'aria-invalid',
        'true'
      );
    });

    it('shows the messages of rows it is told were already left', () => {
      const visited = createCondition({ id: 'visited' });
      render(
        <Harness
          defaultTouched={['visited']}
          initial={createConditionGroup('all', [visited, createCondition()])}
        />
      );
      expect(screen.getAllByText('Select a field and enter a value.')).toHaveLength(1);
    });

    it('names only what is still missing, and checks a number', () => {
      render(
        <Harness
          forceErrors
          initial={createConditionGroup('all', [
            createCondition({ field: 'amount', value: 'ten' }),
            createCondition({ field: 'name' }),
            createCondition({ operator: 'isEmpty' }),
          ])}
        />
      );
      expect(screen.getByText('Enter a number.')).toBeInTheDocument();
      expect(screen.getByText('Enter a value.')).toBeInTheDocument();
      expect(screen.getByText('Select a field.')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Condition 2 Value' })).toHaveAttribute(
        'aria-invalid',
        'true'
      );
    });
  });

  describe('rows and groups', () => {
    it('focuses a new row and moves focus after a delete', async () => {
      render(<Harness initial={createConditionGroup('all', [createCondition()])} />);
      await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
      expect(screen.getByRole('combobox', { name: 'Condition 2 Field' })).toHaveFocus();
      await userEvent.click(screen.getByRole('button', { name: 'Remove condition 2' }));
      expect(screen.getByRole('button', { name: 'Remove condition 1' })).toHaveFocus();
      await userEvent.click(screen.getByRole('button', { name: 'Remove condition 1' }));
      expect(screen.getByText('No conditions.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add condition' })).toHaveFocus();
    });

    it('nests groups up to maxDepth, numbering conditions across the tree', async () => {
      render(<Harness initial={createConditionGroup('all', [createCondition()])} />);
      await userEvent.click(screen.getByRole('button', { name: 'Add group' }));
      const nested = screen.getByRole('group', { name: 'Group 1' });
      expect(
        within(nested).getByRole('combobox', { name: 'Condition 2 Field' })
      ).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Conditions match mode' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Group 1 match mode' })).toBeInTheDocument();
      expect(within(nested).queryByRole('button', { name: 'Add group' })).toBeNull();
    });

    it('confirms before deleting a group that still has conditions', async () => {
      const onValue = vi.fn();
      render(
        <Harness
          onValue={onValue}
          initial={createConditionGroup('all', [createConditionGroup('any', [createCondition()])])}
        />
      );
      await userEvent.click(screen.getByRole('button', { name: 'Group 1 actions' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete group' }));
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent('The group and its condition will be removed.');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Delete group' }));
      await waitFor(() => expect(onValue.mock.lastCall?.[0].children).toEqual([]));
    });

    it('returns focus to the group’s actions when the delete is cancelled', async () => {
      render(
        <Harness
          initial={createConditionGroup('all', [createConditionGroup('any', [createCondition()])])}
        />
      );
      const actions = screen.getByRole('button', { name: 'Group 1 actions' });
      await userEvent.click(actions);
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete group' }));
      await userEvent.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancel' })
      );
      await waitFor(() => expect(actions).toHaveFocus());
    });

    it('shows a group’s match mode only once it has two items, and switches it', async () => {
      const onValue = vi.fn();
      render(
        <Harness onValue={onValue} initial={createConditionGroup('all', [createCondition()])} />
      );
      expect(screen.queryByRole('group', { name: 'Conditions match mode' })).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
      await userEvent.click(
        within(screen.getByRole('group', { name: 'Conditions match mode' })).getByRole('radio', {
          name: 'Any (OR)',
        })
      );
      expect(onValue.mock.lastCall?.[0].mode).toBe('any');
      await userEvent.click(screen.getByRole('button', { name: 'Remove condition 2' }));
      expect(screen.queryByRole('group', { name: 'Conditions match mode' })).toBeNull();
    });

    it('lets the host hide the top group’s match mode, never a nested group’s', () => {
      render(
        <Harness
          showMatchMode={false}
          initial={createConditionGroup('all', [
            createCondition(),
            createConditionGroup('any', [createCondition()]),
          ])}
        />
      );
      expect(screen.queryByRole('group', { name: 'Conditions match mode' })).toBeNull();
      expect(screen.getByRole('group', { name: 'Group 1 match mode' })).toBeInTheDocument();
    });
  });

  it('reads the complete conditions back in plain language', () => {
    render(
      <Harness
        showSummary
        initial={createConditionGroup('any', [
          createCondition({ field: 'amount', operator: 'greaterThan', value: '10' }),
          createConditionGroup('all', [
            createCondition({ field: 'status', operator: 'isOneOf', values: ['open', 'closed'] }),
            createCondition({ field: 'name', operator: 'isEmpty' }),
          ]),
          createCondition(),
        ])}
      />
    );
    expect(
      screen.getByText(
        'Amount greater than 10 or (Status is one of (Open, Closed) and Name is empty)'
      )
    ).toBeInTheDocument();
  });

  it('counts the conditions in a collapsible header', () => {
    render(
      <Harness
        container="collapsible"
        initial={createConditionGroup('all', [createCondition(), createCondition()])}
      />
    );
    expect(screen.getByRole('button', { name: /2 conditions/ })).toBeInTheDocument();
  });

  it('disables every control', () => {
    render(
      <Harness
        disabled
        initial={createConditionGroup('all', [
          createCondition({ field: 'name' }),
          createCondition(),
        ])}
      />
    );
    for (const name of ['Condition 1 Field', 'Condition 1 Operator'])
      expect(screen.getByRole('combobox', { name })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Condition 1 Value' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove condition 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add condition' })).toBeDisabled();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    for (const radio of radios) expect(radio).toBeDisabled();
  });

  it('takes overrides for its strings', () => {
    render(
      <Harness
        initial={createConditionGroup('all', [createCondition(), createCondition()])}
        strings={{
          fieldLabel: 'Champ',
          conditionName: (n) => `Condition n°${n}`,
          matchAll: 'Toutes',
          matchAny: 'Au moins une',
        }}
      />
    );
    expect(screen.getByRole('combobox', { name: 'Condition n°1 Champ' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Toutes' })).toBeChecked();
  });
});

describe('ConditionsEditor model', () => {
  it('saves the operator a row shows by default once it is edited', async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [createCondition({ field: 'name' })])}
      />
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Condition 1 Value' }), 'a');
    expect(lastCondition(onValue)).toMatchObject({ field: 'name', operator: 'equals', value: 'a' });
  });

  it('flags an operator its field type does not offer instead of showing another', () => {
    render(
      <Harness
        forceErrors
        showSummary
        initial={createConditionGroup('all', [
          createCondition({ field: 'amount', operator: 'contains', value: '5' }),
        ])}
      />
    );
    expect(screen.getByText('Select an operator.')).toBeInTheDocument();
    const operator = screen.getByRole('combobox', { name: 'Condition 1 Operator' });
    expect(operator).toHaveTextContent('Select an operator');
    expect(operator).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/Reads as/)).toBeNull();
  });

  it('keeps a value typed before a text field is chosen', async () => {
    const onValue = vi.fn();
    render(
      <Harness onValue={onValue} initial={createConditionGroup('all', [createCondition()])} />
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Condition 1 Value' }), 'Acme');
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'Name');
    expect(lastCondition(onValue)).toMatchObject({
      field: 'name',
      operator: 'equals',
      value: 'Acme',
    });
  });

  it('keeps only the options the new field has when switching between option fields', async () => {
    const fields: ConditionField[] = [
      ...FIELDS,
      {
        value: 'stage',
        label: 'Stage',
        type: 'enum',
        options: [
          { value: 'open', label: 'Open' },
          { value: 'won', label: 'Won' },
        ],
      },
    ];
    const onValue = vi.fn();
    render(
      <Harness
        fields={fields}
        onValue={onValue}
        initial={createConditionGroup('all', [
          createCondition({ field: 'status', operator: 'isOneOf', values: ['open', 'closed'] }),
        ])}
      />
    );
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Field' }), 'Stage');
    expect(lastCondition(onValue)).toMatchObject({
      field: 'stage',
      operator: 'isOneOf',
      values: ['open'],
    });
  });

  it('clears the options when switching between a multiple and a single operator', async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [
          createCondition({ field: 'status', operator: 'isOneOf', values: ['open'] }),
        ])}
      />
    );
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Operator' }), 'Is');
    expect(lastCondition(onValue)).toMatchObject({ operator: 'equals', value: '', values: [] });
  });

  it('picks a single option from the field', async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [createCondition({ field: 'status' })])}
      />
    );
    await choose(screen.getByRole('combobox', { name: 'Condition 1 Value' }), 'Closed');
    expect(lastCondition(onValue)).toMatchObject({ operator: 'equals', value: 'closed' });
  });

  it('flags an option the field does not have', () => {
    render(
      <Harness
        forceErrors
        initial={createConditionGroup('all', [
          createCondition({ field: 'status', value: 'archived' }),
        ])}
      />
    );
    expect(screen.getByText('Enter a value.')).toBeInTheDocument();
  });

  it('falls back to a mode the editor offers, and saves it on the next edit', async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        valueModes={['literal']}
        initial={createConditionGroup('all', [
          createCondition({ field: 'name', valueMode: 'expression', value: 'a' }),
        ])}
      />
    );
    const value = screen.getByRole('textbox', { name: 'Condition 1 Value' });
    expect(value).not.toHaveClass('font-mono');
    await userEvent.type(value, 'b');
    expect(lastCondition(onValue)).toMatchObject({ valueMode: 'literal', value: 'ab' });
  });

  it('copes with a field type that has no operators', () => {
    render(
      <Harness
        forceErrors
        operators={{ ...DEFAULT_CONDITION_OPERATORS, number: [] }}
        initial={createConditionGroup('all', [createCondition({ field: 'amount', value: '1' })])}
      />
    );
    expect(screen.getByText('Select an operator.')).toBeInTheDocument();
  });

  it('gives every new row an id no saved row has', async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [
          createCondition({ id: 'condition-1' }),
          createCondition({ id: 'condition-2' }),
        ])}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    const ids = onValue.mock.lastCall?.[0].children.map((child: { id: string }) => child.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('exports the completeness check hosts use to skip rows', () => {
    expect(
      isConditionComplete(createCondition({ field: 'name', value: 'a' }), { fields: FIELDS })
    ).toBe(true);
    expect(isConditionComplete(createCondition({ field: 'name' }), { fields: FIELDS })).toBe(false);
    expect(
      isConditionComplete(createCondition({ field: 'name', operator: 'isEmpty' }), {
        fields: FIELDS,
      })
    ).toBe(true);
    expect(
      isConditionComplete(createCondition({ field: 'amount', operator: 'contains', value: '1' }), {
        fields: FIELDS,
      })
    ).toBe(false);
  });

  it('keeps untouched groups when updating or removing a node', () => {
    const untouched = createConditionGroup('all', [createCondition()]);
    const target = createCondition({ id: 'target' });
    const root = createConditionGroup('all', [untouched, createConditionGroup('any', [target])]);
    const updated = updateNode(root, 'target', (node) => ({ ...node, value: 'x' }) as typeof node);
    expect(updated.children[0]).toBe(untouched);
    expect(updated.children[1]).not.toBe(root.children[1]);
    expect(removeNode(root, 'missing')).toBe(root);
    expect(removeNode(root, 'target').children[0]).toBe(untouched);
  });
});

describe('ConditionsEditor dates', () => {
  it('shows a stored date on its own day, and reads it back the same way', () => {
    render(
      <Harness
        showSummary
        initial={createConditionGroup('all', [
          createCondition({ field: 'due', value: '2026-12-31' }),
        ])}
      />
    );
    expect(screen.getByLabelText('Condition 1 Value')).toHaveTextContent('December 31st, 2026');
    expect(screen.getByText('Due on December 31st, 2026')).toBeInTheDocument();
  });

  it('stores a picked date without a time, so no time zone moves it', async () => {
    // The calendar opens on the current month.
    const month = format(new Date(), 'yyyy-MM');
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [createCondition({ field: 'due' })])}
      />
    );
    await userEvent.click(screen.getByLabelText('Condition 1 Value'));
    const day = (await screen.findAllByRole('button')).find(
      (button) => button.textContent === '15'
    );
    await userEvent.click(day as HTMLElement);
    expect(lastCondition(onValue)).toMatchObject({ value: `${month}-15` });
  });

  it('flags a date it cannot read', () => {
    render(
      <Harness
        forceErrors
        initial={createConditionGroup('all', [createCondition({ field: 'due', value: 'soon' })])}
      />
    );
    expect(screen.getByText('Enter a valid date.')).toBeInTheDocument();
  });
});

describe('ConditionsEditor focus and messages', () => {
  it('does not count opening a select in the row as leaving it', async () => {
    render(<Harness initial={createConditionGroup('all', [createCondition()])} />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Condition 1 Field' }));
    await screen.findByRole('option', { name: 'Name' });
    expect(screen.queryByText('Select a field and enter a value.')).toBeNull();
  });

  it('still shows messages when the whole editor sits in a dialog', async () => {
    render(
      <div role="dialog" aria-label="Panel">
        <Harness initial={createConditionGroup('all', [createCondition()])} />
        <button type="button">Elsewhere</button>
      </div>
    );
    await userEvent.click(screen.getByRole('textbox', { name: 'Condition 1 Value' }));
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.getByText('Select a field and enter a value.')).toBeInTheDocument();
  });

  it("points the controls at the row's message", () => {
    render(
      <Harness
        forceErrors
        initial={createConditionGroup('all', [createCondition({ field: 'name' })])}
      />
    );
    const message = screen.getByText('Enter a value.');
    const value = screen.getByRole('textbox', { name: 'Condition 1 Value' });
    expect(message.id).toBeTruthy();
    expect(value).toHaveAttribute('aria-describedby', message.id);
    expect(value).toHaveAttribute('aria-errormessage', message.id);
    expect(screen.getByRole('group', { name: 'Conditions' })).toHaveAttribute(
      'aria-describedby',
      screen.getByText('Some conditions are incomplete and will be ignored.').id
    );
  });

  it('forgets a removed row, so a new row with its id starts clean', () => {
    const { rerender } = render(
      <ConditionsEditor
        label="Conditions"
        fields={FIELDS}
        defaultTouched={['x']}
        value={createConditionGroup('all', [createCondition({ id: 'x' })])}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('Select a field and enter a value.')).toBeInTheDocument();
    rerender(
      <ConditionsEditor
        label="Conditions"
        fields={FIELDS}
        value={createConditionGroup('all')}
        onChange={vi.fn()}
      />
    );
    rerender(
      <ConditionsEditor
        label="Conditions"
        fields={FIELDS}
        value={createConditionGroup('all', [createCondition({ id: 'x' })])}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByText('Select a field and enter a value.')).toBeNull();
  });
});

describe('ConditionsEditor groups', () => {
  it('focuses the first field of a new group, and offers no groups at maxDepth 0', async () => {
    const { unmount } = render(
      <Harness initial={createConditionGroup('all', [createCondition()])} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add group' }));
    expect(screen.getByRole('combobox', { name: 'Condition 2 Field' })).toHaveFocus();
    unmount();
    render(<Harness maxDepth={0} initial={createConditionGroup('all')} />);
    expect(screen.queryByRole('button', { name: 'Add group' })).toBeNull();
  });

  it('names groups across the whole tree', () => {
    render(
      <Harness
        maxDepth={2}
        initial={createConditionGroup('all', [
          createConditionGroup('any', [createConditionGroup('all', [createCondition()])]),
          createConditionGroup('any', [createCondition()]),
        ])}
      />
    );
    for (const name of ['Group 1', 'Group 2', 'Group 3'])
      expect(screen.getByRole('group', { name })).toBeInTheDocument();
  });

  it('keeps a group when the deletion is cancelled', async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [createConditionGroup('any', [createCondition()])])}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Group 1 actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete group' }));
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancel' })
    );
    expect(onValue).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Group 1' })).toBeInTheDocument();
  });

  it('deletes an empty group straight away, and flags one left empty', async () => {
    const onValue = vi.fn();
    render(
      <Harness
        onValue={onValue}
        initial={createConditionGroup('all', [
          createCondition(),
          createConditionGroup('any', [createCondition()]),
        ])}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove condition 2' }));
    expect(screen.getByText('No conditions in this group.')).toBeInTheDocument();
    expect(
      screen.getByText('Some conditions are incomplete and will be ignored.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Group 1 actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete group' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onValue.mock.lastCall?.[0].children).toHaveLength(1);
  });
});

describe('ConditionsEditor containers and copy', () => {
  it('starts a collapsible editor closed, keeping the reading and the message in view', async () => {
    render(
      <Harness
        container="collapsible"
        defaultOpen={false}
        forceErrors
        initial={createConditionGroup('all', [
          createCondition({ field: 'name', value: 'Ada' }),
          createCondition(),
        ])}
      />
    );
    const header = screen.getByRole('button', { name: /2 conditions/ });
    expect(header).toHaveTextContent('Name equals Ada');
    expect(screen.queryByRole('combobox', { name: 'Condition 1 Field' })).toBeNull();
    expect(
      screen.getByText('Some conditions are incomplete and will be ignored.')
    ).toBeInTheDocument();
    await userEvent.click(header);
    expect(screen.getByRole('combobox', { name: 'Condition 1 Field' })).toBeInTheDocument();
  });

  it('lets a language reorder the reading', () => {
    render(
      <Harness
        showSummary
        strings={{ summaryCondition: (field, operator, value) => `${value} ${operator} ${field}` }}
        initial={createConditionGroup('all', [createCondition({ field: 'name', value: 'Ada' })])}
      />
    );
    expect(screen.getByText('Ada Equals Name')).toBeInTheDocument();
  });

  it('disables the mode menus and group actions with the rest', () => {
    render(
      <Harness
        disabled
        initial={createConditionGroup('all', [
          createCondition({ field: 'name' }),
          createConditionGroup('any', [createCondition()]),
        ])}
      />
    );
    for (const button of screen.getAllByRole('button', { name: /mode:/ }))
      expect(button).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Group 1 actions' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add group' })).toBeDisabled();
  });

  it('takes a class name', () => {
    const { container } = render(
      <Harness className="mt-4" initial={createConditionGroup('all')} />
    );
    expect(container.firstChild).toHaveClass('mt-4');
  });
});
