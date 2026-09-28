import { act, fireEvent, render as rtlRender, screen, within } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import type { ReactElement } from 'react';
import { describe, expect, it, type Mock, vi } from 'vitest';
import type { CustomGuardrailBuilderValue } from './custom-builder-types';
import { CustomGuardrailBuilder } from './custom-guardrail-builder';
import type { GuardrailFieldGroup, GuardrailRuleFields, GuardrailWordRule } from './rules-types';
import { createGuardrailRule } from './rules-utils';

// The evaluations switch and the always-enforce label carry info tooltips, which need a
// TooltipProvider ancestor.
function render(ui: ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

const FIELDS: GuardrailRuleFields = {
  word: { input: [{ path: 'query', source: 'input', title: 'Search query' }], output: [] },
  number: { input: [{ path: 'maxResults', source: 'input', title: 'Max results' }], output: [] },
};

const FILTER_FIELDS: GuardrailFieldGroup = {
  input: [{ path: 'query', source: 'input', title: 'Search query' }],
  output: [{ path: 'snippet', source: 'output', title: 'Snippet' }],
};

const word = (overrides: Partial<GuardrailWordRule> = {}): GuardrailWordRule => ({
  ...createGuardrailRule('word'),
  ...overrides,
});

function makeGuardrail(
  overrides?: Partial<CustomGuardrailBuilderValue>
): CustomGuardrailBuilderValue {
  return {
    id: 'c1',
    $guardrailType: 'custom',
    name: 'Block secrets',
    selector: { scopes: ['Tool'], matchNames: ['Search web'] },
    action: { $actionType: 'log', severityLevel: 'Info' },
    enabledForEvals: true,
    rules: [createGuardrailRule('always')],
    ...overrides,
  };
}

const save = () => fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
/** The value the last call handed over. */
const savedBy = (callback: Mock) => callback.mock.lastCall?.[0] as CustomGuardrailBuilderValue;
const alwaysEnforce = () => screen.getByRole('switch', { name: 'Always enforce the guardrail' });

describe('CustomGuardrailBuilder', () => {
  describe('a new guardrail', () => {
    it('saves what both products create: always enforced, log, evaluations on, the tool', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          defaultName="Guardrail 2"
          toolName="Search web"
          fields={FIELDS}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();

      expect(onSave).toHaveBeenCalledTimes(1);
      const saved = savedBy(onSave);
      expect(saved).toEqual({
        id: expect.stringMatching(/^guardrail-/),
        $guardrailType: 'custom',
        name: 'Guardrail 2',
        description: undefined,
        selector: { scopes: ['Tool'], matchNames: ['Search web'] },
        action: { $actionType: 'log', severityLevel: 'Info' },
        enabledForEvals: true,
        rules: [{ $ruleType: 'always', applyTo: 'inputAndOutput' }],
      });
    });

    it('computes the Add title', () => {
      render(<CustomGuardrailBuilder open inline onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByText('Add custom guardrail')).toBeInTheDocument();
    });
  });

  describe('editing', () => {
    it('computes the Edit title', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          guardrail={makeGuardrail()}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText('Edit custom guardrail')).toBeInTheDocument();
    });

    it('renders a custom title node when provided', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          title={<span data-testid="custom-title">Custom guardrail builder for Search web</span>}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    // Flow's builder mounted a scope selector at Agent scope, whose effect stripped `Tool` and
    // `matchNames` from a custom guardrail on open. There is no selector here to do that.
    it('saves the selector exactly as it was, other scopes and tools included', () => {
      const onSave = vi.fn();
      const selector = { scopes: ['Agent' as const, 'Tool' as const], matchNames: ['A', 'B'] };
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ selector })}
          toolName="A"
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(savedBy(onSave).selector).toEqual(selector);
    });

    it('saves edited name, description, evaluations flag and rules', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word({ value: 'secret' })] })}
          fields={FIELDS}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText(/guardrail name/i), { target: { value: 'Renamed' } });
      fireEvent.change(screen.getByLabelText(/guardrail description/i), {
        target: { value: 'Why it exists' },
      });
      fireEvent.click(screen.getByRole('switch', { name: /enable guardrail for evaluations/i }));
      fireEvent.change(screen.getByRole('textbox', { name: /^Value/ }), {
        target: { value: 'password' },
      });
      save();

      const saved = savedBy(onSave);
      expect(saved.name).toBe('Renamed');
      expect(saved.description).toBe('Why it exists');
      expect(saved.enabledForEvals).toBe(false);
      expect(saved.rules).toEqual([word({ value: 'password' })]);
    });
  });

  describe('name validation', () => {
    it('blocks Save and shows a message when the name is empty', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ name: '   ' })}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('Guardrail name is required')).toBeInTheDocument();
    });

    it('blocks Save on a case-insensitive duplicate name', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ name: 'My Guardrail' })}
          existingNames={['my guardrail']}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('A guardrail with this name already exists')).toBeInTheDocument();
    });
  });

  describe('rules validation', () => {
    it('says nothing until the first failed Save, then names the rule and its field', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word(), word({ value: 'kept' })] })}
          fields={FIELDS}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      expect(screen.queryByText('Value is required')).not.toBeInTheDocument();
      expect(screen.queryByText('One or more rules are invalid')).not.toBeInTheDocument();

      save();

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('One or more rules are invalid')).toBeInTheDocument();
      const first = screen.getByRole('group', { name: 'Rule 1' });
      expect(within(first).getByText('Value is required')).toBeInTheDocument();
      expect(
        within(screen.getByRole('group', { name: 'Rule 2' })).queryByText('Value is required')
      ).not.toBeInTheDocument();
    });

    it('flags a specific field selection that holds no fields', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({
            rules: [word({ value: 'x', fieldSelector: { $selectorType: 'specific', fields: [] } })],
          })}
          fields={FIELDS}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(screen.getByText('Fields selection is required')).toBeInTheDocument();
    });

    it('requires at least one rule', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [] })}
          fields={FIELDS}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('At least one rule is required')).toBeInTheDocument();
    });

    it('reports a stored always rule next to field rules, and renders both to fix it', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({
            rules: [createGuardrailRule('always'), word({ value: 'secret' })],
          })}
          fields={FIELDS}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('group', { name: 'Rule 1' })).toBeInTheDocument();
      save();
      expect(onSave).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          "You cannot combine an 'Always enforce guardrail' with any other rule type"
        )
      ).toBeInTheDocument();
    });
  });

  describe('always enforce', () => {
    // Flow's builder kept the field rules in state behind the switch and saved them next to the
    // always rule, a value Agents rejects.
    it('saves the always rule alone once the switch is on', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word({ value: 'secret' })] })}
          fields={FIELDS}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(alwaysEnforce());
      save();

      expect(savedBy(onSave).rules).toEqual([{ $ruleType: 'always', applyTo: 'inputAndOutput' }]);
    });

    // Flow validated the rules its switch was hiding on a tool with no fields, so a stored field
    // rule could block Save with a message about something not on screen.
    it('never blocks Save on a tool with no fields', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          defaultName="Guardrail"
          fields={{}}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      expect(alwaysEnforce()).toBeChecked();
      expect(alwaysEnforce()).toBeDisabled();
      save();
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('shows the stored rules it validates on a tool with no fields', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word()] })}
          fields={{}}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      save();
      const rule = screen.getByRole('group', { name: 'Rule 1' });
      expect(within(rule).getByText('Value is required')).toBeInTheDocument();
      expect(alwaysEnforce()).toBeEnabled();
    });

    it('asks confirmAlwaysEnforce before dropping an edited rule, and keeps it on false', () => {
      const confirmAlwaysEnforce = vi.fn(() => false);
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word({ value: 'secret' })] })}
          fields={FIELDS}
          confirmAlwaysEnforce={confirmAlwaysEnforce}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(alwaysEnforce());

      expect(confirmAlwaysEnforce).toHaveBeenCalledTimes(1);
      expect(alwaysEnforce()).not.toBeChecked();
      expect(screen.getByRole('group', { name: 'Rule 1' })).toBeInTheDocument();
    });

    it('applies the switch once confirmAlwaysEnforce resolves true', async () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word({ value: 'secret' })] })}
          fields={FIELDS}
          confirmAlwaysEnforce={() => Promise.resolve(true)}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      await act(async () => {
        fireEvent.click(alwaysEnforce());
      });

      expect(alwaysEnforce()).toBeChecked();
      expect(screen.queryByRole('group', { name: 'Rule 1' })).not.toBeInTheDocument();
      save();
      expect(savedBy(onSave).rules).toEqual([{ $ruleType: 'always', applyTo: 'inputAndOutput' }]);
    });

    it('does not ask when switching on loses nothing', () => {
      const confirmAlwaysEnforce = vi.fn(() => false);
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word()] })}
          fields={FIELDS}
          confirmAlwaysEnforce={confirmAlwaysEnforce}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(alwaysEnforce());
      expect(confirmAlwaysEnforce).not.toHaveBeenCalled();
      expect(alwaysEnforce()).toBeChecked();
    });
  });

  describe('action', () => {
    it('blocks Save on an empty block reason', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ action: { $actionType: 'block', reason: ' ' } })}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('Block reason is required')).toBeInTheDocument();
    });

    it('edits the filter fields as references and shows their message once', async () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ action: { $actionType: 'filter', fields: [] } })}
          filterFields={FILTER_FIELDS}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getAllByText('Fields selection is required')).toHaveLength(1);

      fireEvent.click(screen.getByRole('combobox', { name: /Fields to filter/ }));
      fireEvent.click(await screen.findByRole('option', { name: 'Snippet' }));
      save();

      expect(savedBy(onSave).action).toEqual({
        $actionType: 'filter',
        fields: [{ path: 'snippet', source: 'output', title: 'Snippet' }],
      });
    });

    it('says the tool has no schema when there are no filter fields', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ action: { $actionType: 'filter', fields: [] } })}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText('No schema available to show fields')).toBeInTheDocument();
    });

    it('passes the escalate slots through to the action section', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({
            action: {
              $actionType: 'escalate',
              app: { id: '', version: '', name: '' },
              recipient: { type: 1, value: '', displayName: '' },
            },
          })}
          renderRecipientSearch={() => <div data-testid="host-directory-search" />}
          renderAppPicker={() => <div data-testid="host-app-picker" />}
          escalateHelp={<p data-testid="host-help" />}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId('host-directory-search')).toBeInTheDocument();
      expect(screen.getByTestId('host-app-picker')).toBeInTheDocument();
      expect(screen.getByTestId('host-help')).toBeInTheDocument();
    });
  });

  describe('host errors', () => {
    it('displays host errors immediately and gates Save', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail()}
          errors={{ name: 'Backend rejected this name' }}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Backend rejected this name')).toBeInTheDocument();
      save();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('lets the host message win over the internal one per field', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ name: '' })}
          errors={{ name: 'Host-specific message' }}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(screen.getByText('Host-specific message')).toBeInTheDocument();
      expect(screen.queryByText('Guardrail name is required')).not.toBeInTheDocument();
    });

    it('merges host rule errors rule by rule and field by field', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({
            rules: [
              word({ fieldSelector: { $selectorType: 'specific', fields: [] } }),
              word({ value: 'fine' }),
            ],
          })}
          fields={FIELDS}
          errors={{ perRule: [{ value: 'Host value message' }, { value: 'Not allowed here' }] }}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Not allowed here')).toBeInTheDocument();
      save();
      const first = screen.getByRole('group', { name: 'Rule 1' });
      expect(within(first).getByText('Host value message')).toBeInTheDocument();
      expect(within(first).queryByText('Value is required')).not.toBeInTheDocument();
      expect(within(first).getByText('Fields selection is required')).toBeInTheDocument();
    });

    it('does not gate Save on a host perRule array without a message', () => {
      const onSave = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail()}
          errors={{ perRule: [undefined, {}] }}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('save as new', () => {
    it('calls onSaveAsNew with the current value when valid', () => {
      const onSaveAsNew = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail()}
          onSave={vi.fn()}
          onSaveAsNew={onSaveAsNew}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save as new/i }));
      expect(savedBy(onSaveAsNew).name).toBe('Block secrets');
    });

    it('blocks onSaveAsNew and surfaces errors when invalid', () => {
      const onSaveAsNew = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ name: '' })}
          onSave={vi.fn()}
          onSaveAsNew={onSaveAsNew}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save as new/i }));
      expect(onSaveAsNew).not.toHaveBeenCalled();
      expect(screen.getByText('Guardrail name is required')).toBeInTheDocument();
    });

    it('disables both saves while the host gate is on', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail()}
          saveDisabled
          onSave={vi.fn()}
          onSaveAsNew={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /save as new/i })).toBeDisabled();
    });

    it('renders the mixed-scopes banner from otherAppliedScopes', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail()}
          otherAppliedScopes={{ scopes: ['Agent'], tools: ['Other tool'] }}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('This guardrail is also applied to:')).toBeInTheDocument();
      expect(screen.getByText('Other tool')).toBeInTheDocument();
    });
  });

  describe('help line', () => {
    it('ends in the documentation link and reports it being followed', () => {
      const onDocsLinkClick = vi.fn();
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          docsHref="https://docs.example.test/guardrails"
          onDocsLinkClick={onDocsLinkClick}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const link = screen.getByRole('link', { name: 'here' });
      expect(link).toHaveAttribute('href', 'https://docs.example.test/guardrails');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.parentElement).toHaveTextContent(
        'Guardrail is a collection of rules and action that should happen when all of the rules are met. Learn more about Guardrail rules and actions here'
      );
      // happy-dom would otherwise follow the link and fetch the page.
      link.addEventListener('click', (event) => event.preventDefault());
      fireEvent.click(link);
      expect(onDocsLinkClick).toHaveBeenCalledTimes(1);
    });

    it('keeps only the first sentence without docsHref', () => {
      render(<CustomGuardrailBuilder open inline hideHeader onSave={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByText(/Learn more/)).not.toBeInTheDocument();
      expect(screen.getByText(/Guardrail is a collection of rules/)).toBeInTheDocument();
    });
  });

  describe('layout options', () => {
    it('renders the evals toggle in the footer when evalsTogglePlacement is footer', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          evalsTogglePlacement="footer"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const toggle = screen.getByRole('switch', { name: /enable guardrail for evaluations/i });
      expect(toggle.closest('div.border-t')).not.toBeNull();
    });

    it('opens as an 800px dialog by default, and takes dialogMaxWidth', () => {
      const { rerender } = render(
        <CustomGuardrailBuilder open onSave={vi.fn()} onCancel={vi.fn()} />
      );
      expect(screen.getByRole('dialog')).toHaveStyle({ maxWidth: '800px' });
      expect(screen.getByRole('dialog')).toHaveTextContent('Add custom guardrail');

      rerender(
        <TooltipProvider>
          <CustomGuardrailBuilder open dialogMaxWidth={900} onSave={vi.fn()} onCancel={vi.fn()} />
        </TooltipProvider>
      );
      expect(screen.getByRole('dialog')).toHaveStyle({ maxWidth: '900px' });
    });

    it('applies label overrides', () => {
      render(
        <CustomGuardrailBuilder
          open
          inline
          labels={{ addTitle: 'New custom guardrail', nameLabel: 'Name' }}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('New custom guardrail')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /^Name/ })).toBeInTheDocument();
    });
  });

  describe('ancestor form safety', () => {
    // Mounted `inline` inside a host's <form>, Enter in the name input would submit the host.
    it('cancels Enter in its own single-line inputs so an ancestor form cannot submit', () => {
      render(<CustomGuardrailBuilder open inline hideHeader onSave={vi.fn()} onCancel={vi.fn()} />);

      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      screen.getByLabelText(/guardrail name/i).dispatchEvent(enter);
      expect(enter.defaultPrevented).toBe(true);
    });

    it('leaves Enter alone in a textarea, which needs it for newlines', () => {
      render(<CustomGuardrailBuilder open inline hideHeader onSave={vi.fn()} onCancel={vi.fn()} />);

      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      screen.getByLabelText(/guardrail description/i).dispatchEvent(enter);
      expect(enter.defaultPrevented).toBe(false);
    });
  });

  describe('multiple instances', () => {
    it('renders no duplicate ids across two inline builders', () => {
      const instance = () => (
        <CustomGuardrailBuilder
          open
          inline
          hideHeader
          guardrail={makeGuardrail({ rules: [word({ value: 'a' }), word({ value: 'b' })] })}
          fields={FIELDS}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      const { container } = render(
        <>
          {instance()}
          {instance()}
        </>
      );

      const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
      for (const label of container.querySelectorAll('label[for]')) {
        const target = label.getAttribute('for');
        expect(container.querySelectorAll(`[id="${target}"]`)).toHaveLength(1);
      }
    });
  });

  describe('accessibility', () => {
    it('has no violations inline, with rules, filter and errors on screen', async () => {
      const { container } = render(
        <CustomGuardrailBuilder
          open
          inline
          guardrail={makeGuardrail({
            rules: [word(), { ...createGuardrailRule('number'), value: 3 }],
            action: { $actionType: 'filter', fields: [] },
          })}
          fields={FIELDS}
          filterFields={FILTER_FIELDS}
          docsHref="https://docs.example.test/guardrails"
          otherAppliedScopes={{ scopes: ['Agent'], tools: [] }}
          onSave={vi.fn()}
          onSaveAsNew={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      save();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations as a dialog', async () => {
      render(
        <CustomGuardrailBuilder
          open
          fields={FIELDS}
          docsHref="https://docs.example.test/guardrails"
          evalsTogglePlacement="footer"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(await axe(screen.getByRole('dialog'))).toHaveNoViolations();
    });
  });
});
