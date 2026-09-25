import { fireEvent, render as rtlRender, screen, within } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import { type ReactElement, type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApI18nProvider } from '../../../i18n';
import { GuardrailRulesSection, type GuardrailRulesSectionProps } from './guardrail-rules-section';
import type { GuardrailRule, GuardrailRuleFields, GuardrailWordRule } from './rules-types';
import { createGuardrailRule } from './rules-utils';

// The always-enforce label carries an info tooltip, which needs a provider.
function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
function render(ui: ReactElement) {
  return rtlRender(ui, { wrapper: Providers });
}

const FIELDS: GuardrailRuleFields = {
  word: {
    input: [
      { path: 'customer.email', source: 'input', title: 'Customer email' },
      { path: 'query', source: 'input' },
    ],
    output: [{ path: 'summary', source: 'output', title: 'Summary' }],
  },
  number: { input: [{ path: 'amount', source: 'input', title: 'Amount' }], output: [] },
};

const ALWAYS: GuardrailRule = { $ruleType: 'always', applyTo: 'inputAndOutput' };

const word = (overrides: Partial<GuardrailWordRule> = {}): GuardrailWordRule => ({
  ...createGuardrailRule('word'),
  ...overrides,
});

type HostProps = Omit<GuardrailRulesSectionProps, 'rules' | 'onRulesChange'> & {
  initial: GuardrailRule[];
  onRulesChange?: (rules: GuardrailRule[]) => void;
};

/** Keeps the rules in state so the controls move, and reports every change. */
function Host({ initial, onRulesChange, ...props }: HostProps) {
  const [rules, setRules] = useState(initial);
  return (
    <GuardrailRulesSection
      {...props}
      rules={rules}
      onRulesChange={(next) => {
        onRulesChange?.(next);
        setRules(next);
      }}
    />
  );
}

async function pickOption(trigger: HTMLElement, name: string) {
  fireEvent.click(trigger);
  fireEvent.click(await screen.findByRole('option', { name }));
}

describe('GuardrailRulesSection', () => {
  describe('always enforce', () => {
    it('shows the stage select and no rule cards for an always rule', () => {
      render(<GuardrailRulesSection rules={[ALWAYS]} onRulesChange={vi.fn()} fields={FIELDS} />);

      expect(screen.getByRole('switch', { name: 'Always enforce the guardrail' })).toBeChecked();
      expect(
        screen.getByRole('combobox', { name: /Enforce guardrail action during/ })
      ).toHaveTextContent('Pre-execution and post-execution');
      expect(screen.queryByRole('group', { name: /Rule/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add rule' })).not.toBeInTheDocument();
    });

    it('changes the stage of the always rule', async () => {
      const onRulesChange = vi.fn();
      render(
        <GuardrailRulesSection rules={[ALWAYS]} onRulesChange={onRulesChange} fields={FIELDS} />
      );

      await pickOption(
        screen.getByRole('combobox', { name: /Enforce guardrail action during/ }),
        'Post-execution (output)'
      );

      expect(onRulesChange).toHaveBeenCalledWith([{ $ruleType: 'always', applyTo: 'output' }]);
    });

    it('switching off starts one rule of the first type the fields serve', () => {
      const onRulesChange = vi.fn();
      render(
        <GuardrailRulesSection
          rules={[ALWAYS]}
          onRulesChange={onRulesChange}
          fields={{ number: FIELDS.number }}
        />
      );

      fireEvent.click(screen.getByRole('switch'));

      expect(onRulesChange).toHaveBeenCalledWith([createGuardrailRule('number')]);
    });

    it('switching on over untouched rules applies at once, even with a confirm callback', () => {
      const onRulesChange = vi.fn();
      const onRequestAlwaysEnforce = vi.fn();
      render(
        <GuardrailRulesSection
          rules={[word(), createGuardrailRule('number')]}
          onRulesChange={onRulesChange}
          onRequestAlwaysEnforce={onRequestAlwaysEnforce}
          fields={FIELDS}
        />
      );

      fireEvent.click(screen.getByRole('switch'));

      expect(onRulesChange).toHaveBeenCalledWith([createGuardrailRule('always')]);
      expect(onRequestAlwaysEnforce).not.toHaveBeenCalled();
    });

    it('asks the host before dropping edited rules', () => {
      const onRulesChange = vi.fn();
      const onRequestAlwaysEnforce = vi.fn();
      render(
        <GuardrailRulesSection
          rules={[word({ value: 'secret' })]}
          onRulesChange={onRulesChange}
          onRequestAlwaysEnforce={onRequestAlwaysEnforce}
          fields={FIELDS}
        />
      );

      fireEvent.click(screen.getByRole('switch'));

      expect(onRequestAlwaysEnforce).toHaveBeenCalledWith([createGuardrailRule('always')]);
      expect(onRulesChange).not.toHaveBeenCalled();
    });

    it('drops edited rules at once when the host asks for no confirmation', () => {
      const onRulesChange = vi.fn();
      render(
        <GuardrailRulesSection
          rules={[word({ value: 'secret' })]}
          onRulesChange={onRulesChange}
          fields={FIELDS}
        />
      );

      fireEvent.click(screen.getByRole('switch'));

      expect(onRulesChange).toHaveBeenCalledWith([createGuardrailRule('always')]);
    });

    it('locks the switch on when no rule type has a field', () => {
      render(<GuardrailRulesSection rules={[ALWAYS]} onRulesChange={vi.fn()} fields={{}} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeChecked();
      expect(toggle).toBeDisabled();
    });

    it('keeps an always rule stored next to field rules visible, so it can be fixed', () => {
      render(
        <GuardrailRulesSection
          rules={[ALWAYS, word({ value: 'x' })]}
          onRulesChange={vi.fn()}
          fields={FIELDS}
          errors={{ rules: 'You cannot combine an always rule with other rules' }}
        />
      );

      expect(screen.getByRole('switch')).toBeChecked();
      expect(screen.getByRole('group', { name: 'Rule 1' })).toBeInTheDocument();
      expect(
        screen.getByText('You cannot combine an always rule with other rules')
      ).toBeInTheDocument();
    });
  });

  describe('field rules', () => {
    it('renders one numbered card per field rule', () => {
      render(
        <GuardrailRulesSection
          rules={[word({ value: 'a' }), createGuardrailRule('number')]}
          onRulesChange={vi.fn()}
          fields={FIELDS}
        />
      );

      expect(screen.getByRole('switch')).not.toBeChecked();
      expect(screen.getByRole('group', { name: 'Rule 1' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Rule 2' })).toBeInTheDocument();
    });

    it('adds a rule of the first type the fields serve', () => {
      const onRulesChange = vi.fn();
      render(
        <Host initial={[]} onRulesChange={onRulesChange} fields={{ number: FIELDS.number }} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add rule' }));

      expect(onRulesChange).toHaveBeenLastCalledWith([createGuardrailRule('number')]);
      expect(screen.getByRole('group', { name: 'Rule 1' })).toBeInTheDocument();
    });

    it('deletes the rule whose button was pressed', () => {
      const onRulesChange = vi.fn();
      const first = word({ value: 'a' });
      const second = word({ value: 'b' });
      render(
        <GuardrailRulesSection
          rules={[first, second]}
          onRulesChange={onRulesChange}
          fields={FIELDS}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Delete rule 2' }));

      expect(onRulesChange).toHaveBeenCalledWith([first]);
    });

    it('offers only the rule types the fields serve, and resets a rule on a type change', async () => {
      const onRulesChange = vi.fn();
      render(
        <GuardrailRulesSection
          rules={[word({ value: 'a' })]}
          onRulesChange={onRulesChange}
          fields={FIELDS}
        />
      );

      const card = screen.getByRole('group', { name: 'Rule 1' });
      fireEvent.click(within(card).getByRole('combobox', { name: /Rule type/ }));
      expect(await screen.findByRole('option', { name: 'String' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Boolean' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('option', { name: 'Number' }));

      expect(onRulesChange).toHaveBeenCalledWith([createGuardrailRule('number')]);
    });

    it('offers every rule type when there is no schema', async () => {
      render(<GuardrailRulesSection rules={[word()]} onRulesChange={vi.fn()} />);

      fireEvent.click(screen.getByRole('combobox', { name: /Rule type/ }));

      expect(await screen.findByRole('option', { name: 'Boolean' })).toBeInTheDocument();
    });

    it('filters the operators by rule type', async () => {
      render(
        <GuardrailRulesSection
          rules={[createGuardrailRule('number')]}
          onRulesChange={vi.fn()}
          fields={FIELDS}
        />
      );

      fireEvent.click(screen.getByRole('combobox', { name: /Operator/ }));

      expect(await screen.findByRole('option', { name: 'Greater than' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Contains' })).not.toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(6);
    });

    it('hides the value for the emptiness checks', async () => {
      render(<Host initial={[word({ value: 'a' })]} fields={FIELDS} />);

      expect(screen.getByRole('textbox', { name: /Value/ })).toBeInTheDocument();
      await pickOption(screen.getByRole('combobox', { name: /Operator/ }), 'Is empty');

      expect(screen.queryByRole('textbox', { name: /Value/ })).not.toBeInTheDocument();
    });

    it('reports each value type as the wire stores it', async () => {
      const onRulesChange = vi.fn();
      render(
        <GuardrailRulesSection
          rules={[word(), createGuardrailRule('number'), createGuardrailRule('boolean')]}
          onRulesChange={onRulesChange}
        />
      );

      fireEvent.change(
        within(screen.getByRole('group', { name: 'Rule 1' })).getByRole('textbox', {
          name: /Value/,
        }),
        { target: { value: 'secret' } }
      );
      expect(onRulesChange).toHaveBeenLastCalledWith([
        word({ value: 'secret' }),
        createGuardrailRule('number'),
        createGuardrailRule('boolean'),
      ]);

      fireEvent.change(
        within(screen.getByRole('group', { name: 'Rule 2' })).getByRole('spinbutton', {
          name: /Value/,
        }),
        { target: { value: '-2.5' } }
      );
      expect(onRulesChange.mock.lastCall?.[0][1]).toEqual({
        ...createGuardrailRule('number'),
        value: -2.5,
      });

      await pickOption(
        within(screen.getByRole('group', { name: 'Rule 3' })).getByRole('combobox', {
          name: /Value/,
        }),
        'True'
      );
      expect(onRulesChange.mock.lastCall?.[0][2]).toEqual({
        ...createGuardrailRule('boolean'),
        value: true,
      });
    });

    it('keeps a cleared number input empty while it has focus', () => {
      render(<Host initial={[createGuardrailRule('number')]} />);

      const input = screen.getByRole('spinbutton', { name: /Value/ });
      fireEvent.change(input, { target: { value: '' } });
      expect(input).toHaveValue(null);

      fireEvent.blur(input);
      expect(input).toHaveValue(0);
    });
  });

  describe('field picker', () => {
    it('starts on all fields and lists the fields of the rule type by source', async () => {
      render(<Host initial={[word({ value: 'a' })]} fields={FIELDS} />);

      const trigger = screen.getByRole('combobox', { name: /Apply to fields/ });
      expect(trigger).toHaveTextContent('All fields');

      fireEvent.click(trigger);
      const listbox = await screen.findByRole('listbox');
      expect(within(listbox).getByRole('option', { name: 'All fields' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
      expect(within(listbox).getByRole('group', { name: 'Input' })).toBeInTheDocument();
      expect(within(listbox).getByRole('group', { name: 'Output' })).toBeInTheDocument();
      expect(within(listbox).queryByRole('option', { name: 'Amount' })).not.toBeInTheDocument();
    });

    it('names its popover and search input, and passes axe while open', async () => {
      render(<Host initial={[word({ value: 'a' })]} fields={FIELDS} />);

      fireEvent.click(screen.getByRole('combobox', { name: /Apply to fields/ }));

      const popover = await screen.findByRole('dialog', { name: /Apply to fields/ });
      expect(
        within(popover).getByRole('combobox', { name: 'Search fields...' })
      ).toBeInTheDocument();
      // The popover portals out of the render container the other axe runs scan.
      expect(await axe(popover)).toHaveNoViolations();
    });

    it('selects specific fields, and returns to all fields when the last one goes', async () => {
      const onRulesChange = vi.fn();
      render(
        <Host initial={[word({ value: 'a' })]} fields={FIELDS} onRulesChange={onRulesChange} />
      );

      await pickOption(screen.getByRole('combobox', { name: /Apply to fields/ }), 'Customer email');
      expect(onRulesChange).toHaveBeenLastCalledWith([
        word({
          value: 'a',
          fieldSelector: {
            $selectorType: 'specific',
            fields: [{ path: 'customer.email', source: 'input', title: 'Customer email' }],
          },
        }),
      ]);
      expect(screen.getByRole('combobox', { name: /Apply to fields/ })).toHaveTextContent(
        'Customer email'
      );

      fireEvent.click(await screen.findByRole('option', { name: 'Summary' }));
      expect(screen.getByRole('combobox', { name: /Apply to fields/ })).toHaveTextContent(
        '2 fields selected'
      );

      // No chips: the list is where a picked field is unpicked.
      fireEvent.click(screen.getByRole('option', { name: 'Customer email' }));
      fireEvent.click(screen.getByRole('option', { name: 'Summary' }));
      expect(onRulesChange).toHaveBeenLastCalledWith([word({ value: 'a' })]);
      expect(screen.getByRole('combobox', { name: /Apply to fields/ })).toHaveTextContent(
        'All fields'
      );
    });

    it('names a stored field the schema no longer lists, and still lists it', async () => {
      render(
        <GuardrailRulesSection
          rules={[
            word({
              value: 'a',
              fieldSelector: {
                $selectorType: 'specific',
                fields: [{ path: 'legacy.field', source: 'output' }],
              },
            }),
          ]}
          onRulesChange={vi.fn()}
          fields={FIELDS}
        />
      );

      const trigger = screen.getByRole('combobox', { name: /Apply to fields/ });
      expect(trigger).toHaveTextContent('legacy.field');

      fireEvent.click(trigger);
      const output = within(await screen.findByRole('group', { name: 'Output' }));
      expect(output.getByRole('option', { name: 'legacy.field' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });
  });

  describe('errors', () => {
    it('renders each rule its own messages, and the section message', () => {
      render(
        <GuardrailRulesSection
          rules={[
            word({ value: 'a' }),
            word({ fieldSelector: { $selectorType: 'specific', fields: [] } }),
          ]}
          onRulesChange={vi.fn()}
          fields={FIELDS}
          errors={{
            rules: 'One or more rules are invalid',
            perRule: [
              undefined,
              { fields: 'Fields selection is required', value: 'Value is required' },
            ],
          }}
        />
      );

      const first = screen.getByRole('group', { name: 'Rule 1' });
      const second = screen.getByRole('group', { name: 'Rule 2' });
      expect(within(first).queryByText('Value is required')).not.toBeInTheDocument();
      expect(within(second).getByRole('textbox', { name: /Value/ })).toHaveAccessibleDescription(
        'Value is required'
      );
      expect(
        within(second).getByRole('combobox', { name: /Apply to fields/ })
      ).toHaveAccessibleDescription('Fields selection is required');
      expect(screen.getByText('One or more rules are invalid')).toBeInTheDocument();
    });
  });

  describe('renderFieldSelector', () => {
    it('replaces the picker and hands over what a host control needs', () => {
      const renderFieldSelector = vi.fn(
        (ctx: Parameters<NonNullable<GuardrailRulesSectionProps['renderFieldSelector']>>[0]) => (
          <button
            type="button"
            aria-labelledby={ctx.labelId}
            onClick={() => ctx.onChange({ $selectorType: 'all' })}
          >
            host picker
          </button>
        )
      );
      const onRulesChange = vi.fn();
      const rule = word({
        value: 'a',
        fieldSelector: { $selectorType: 'specific', fields: [{ path: 'query', source: 'input' }] },
      });
      render(
        <GuardrailRulesSection
          rules={[rule]}
          onRulesChange={onRulesChange}
          fields={FIELDS}
          renderFieldSelector={renderFieldSelector}
          errors={{ perRule: [{ fields: 'Pick a field' }] }}
        />
      );

      expect(renderFieldSelector).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 0,
          ruleType: 'word',
          selector: rule.fieldSelector,
          fields: FIELDS.word,
          label: 'Apply to fields',
          invalid: true,
          error: 'Pick a field',
        })
      );
      expect(screen.queryByRole('combobox', { name: /Apply to fields/ })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Apply to fields/ }));
      expect(onRulesChange).toHaveBeenCalledWith([
        { ...rule, fieldSelector: { $selectorType: 'all' } },
      ]);
    });

    it('falls through to the built-in picker on undefined', () => {
      render(
        <GuardrailRulesSection
          rules={[word({ value: 'a' })]}
          onRulesChange={vi.fn()}
          fields={FIELDS}
          renderFieldSelector={() => undefined}
        />
      );

      expect(screen.getByRole('combobox', { name: /Apply to fields/ })).toBeInTheDocument();
    });
  });

  describe('standalone use', () => {
    it('renders with no labels prop at all', () => {
      render(<GuardrailRulesSection rules={[word()]} onRulesChange={vi.fn()} />);

      expect(screen.getByText('Always enforce the guardrail')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete rule 1' })).toBeInTheDocument();
    });

    it('takes a partial labels override and resolves the rest', () => {
      render(
        <GuardrailRulesSection
          rules={[word()]}
          onRulesChange={vi.fn()}
          labels={{ addRule: 'New condition', ruleTitle: 'Condition {{position}}' }}
        />
      );

      expect(screen.getByRole('button', { name: 'New condition' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Condition 1' })).toBeInTheDocument();
      expect(screen.getByText('Operator')).toBeInTheDocument();
    });

    it('resolves reused ids from the ambient catalog', () => {
      rtlRender(
        <ApI18nProvider component="canvas" locale="ja">
          <TooltipProvider>
            <GuardrailRulesSection rules={[ALWAYS]} onRulesChange={vi.fn()} />
          </TooltipProvider>
        </ApI18nProvider>
      );

      // The info tooltip's name reuses the validator form's id, which already translates. The
      // section's own ids render English until `chore(l10n): sync from Localization` reaches them.
      expect(screen.getByRole('button', { name: '詳細情報' })).toBeInTheDocument();
    });

    it('keeps DOM ids unique across rules and across sections', () => {
      const { container } = render(
        <>
          <GuardrailRulesSection rules={[word(), word()]} onRulesChange={vi.fn()} />
          <GuardrailRulesSection rules={[word()]} onRulesChange={vi.fn()} />
        </>
      );

      const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('lays a rule out by the section width: stacked, two by two, then one row', () => {
      // happy-dom evaluates no container queries, so this pins the classes that do.
      const { container } = render(
        <GuardrailRulesSection rules={[word()]} onRulesChange={vi.fn()} />
      );

      const grid = container.querySelector('[data-slot="guardrail-rule"] .grid');
      expect(grid).toHaveClass('grid-cols-1', '@sm:grid-cols-2', '@3xl:grid-cols-4');
      expect(container.querySelector('[data-slot="guardrail-rules-section"]')).toHaveClass(
        '@container'
      );
    });

    it('merges className onto its root', () => {
      const { container } = render(
        <GuardrailRulesSection rules={[ALWAYS]} onRulesChange={vi.fn()} className="mt-4" />
      );

      const root = container.querySelector('[data-slot="guardrail-rules-section"]');
      expect(root).toHaveClass('mt-4', '@container');
    });
  });

  describe('accessibility', () => {
    it('has no violations with field rules and errors', async () => {
      const { container } = render(
        <GuardrailRulesSection
          rules={[
            word({
              fieldSelector: {
                $selectorType: 'specific',
                fields: [{ path: 'customer.email', source: 'input', title: 'Customer email' }],
              },
            }),
            createGuardrailRule('number'),
            createGuardrailRule('boolean'),
          ]}
          onRulesChange={vi.fn()}
          errors={{
            rules: 'One or more rules are invalid',
            perRule: [{ value: 'Value is required' }],
          }}
        />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations when always enforced', async () => {
      const { container } = render(
        <GuardrailRulesSection rules={[ALWAYS]} onRulesChange={vi.fn()} fields={{}} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
