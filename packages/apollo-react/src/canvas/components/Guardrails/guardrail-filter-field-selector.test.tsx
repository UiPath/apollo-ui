import { fireEvent, render as rtlRender, screen, within } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import { type ReactElement, type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { GuardrailAction } from './builder-types';
import { GuardrailActionSection } from './components/guardrail-action-section';
import { GuardrailFilterFieldSelector } from './guardrail-filter-field-selector';
import type { GuardrailFieldGroup, GuardrailFieldReference } from './rules-types';

// The label's info tooltip needs a provider.
function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
function render(ui: ReactElement) {
  return rtlRender(ui, { wrapper: Providers });
}

const FIELDS: GuardrailFieldGroup = {
  input: [
    { path: 'customer.email', source: 'input', title: 'Customer email' },
    { path: 'id', source: 'input' },
  ],
  output: [{ path: 'id', source: 'output' }],
};

describe('GuardrailFilterFieldSelector', () => {
  it('says so when the tool has no schema', () => {
    render(<GuardrailFilterFieldSelector value={[]} onChange={vi.fn()} />);

    expect(screen.getByText('Fields to filter')).toBeInTheDocument();
    expect(screen.getByText('No schema available to show fields')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('still shows its error when the tool has no schema', () => {
    render(
      <GuardrailFilterFieldSelector
        value={[]}
        onChange={vi.fn()}
        error="Fields selection is required"
      />
    );

    expect(screen.getByText('No schema available to show fields')).toBeInTheDocument();
    expect(screen.getByText('Fields selection is required')).toBeInTheDocument();
  });

  it('summarizes the selection on its trigger', () => {
    const { rerender } = render(
      <GuardrailFilterFieldSelector fields={FIELDS} value={[]} onChange={vi.fn()} />
    );
    const trigger = () => screen.getByRole('combobox', { name: /Fields to filter/ });
    expect(trigger()).toHaveTextContent('Select fields');

    rerender(
      <GuardrailFilterFieldSelector
        fields={FIELDS}
        value={[{ path: 'customer.email', source: 'input' }]}
        onChange={vi.fn()}
      />
    );
    expect(trigger()).toHaveTextContent('Customer email');

    rerender(
      <GuardrailFilterFieldSelector
        fields={FIELDS}
        value={[
          { path: 'customer.email', source: 'input' },
          { path: 'id', source: 'output' },
        ]}
        onChange={vi.fn()}
      />
    );
    expect(trigger()).toHaveTextContent('2 fields selected');
  });

  it('offers no all-fields entry and tells same-path fields apart by source', async () => {
    const onChange = vi.fn();
    render(<GuardrailFilterFieldSelector fields={FIELDS} value={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('combobox', { name: /Fields to filter/ }));
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).queryByRole('option', { name: 'All fields' })).not.toBeInTheDocument();

    fireEvent.click(
      within(within(listbox).getByRole('group', { name: 'Output' })).getByRole('option')
    );
    expect(onChange).toHaveBeenCalledWith([{ path: 'id', source: 'output' }]);
  });

  it('unpicks a field from the list, which shows it checked', async () => {
    const onChange = vi.fn();
    const value: GuardrailFieldReference[] = [
      { path: 'customer.email', source: 'input', title: 'Customer email' },
      { path: 'id', source: 'input' },
    ];
    render(<GuardrailFilterFieldSelector fields={FIELDS} value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole('combobox', { name: /Fields to filter/ }));
    const option = await screen.findByRole('option', { name: 'Customer email' });
    expect(option).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith([{ path: 'id', source: 'input' }]);
  });

  it('lists picked fields as removable chips only with selectionChips', () => {
    const onChange = vi.fn();
    const value: GuardrailFieldReference[] = [
      { path: 'customer.email', source: 'input', title: 'Customer email' },
      { path: 'id', source: 'input' },
    ];
    const { rerender } = render(
      <GuardrailFilterFieldSelector fields={FIELDS} value={value} onChange={onChange} />
    );
    expect(screen.queryByRole('button', { name: /Remove field/ })).not.toBeInTheDocument();

    rerender(
      <GuardrailFilterFieldSelector
        fields={FIELDS}
        value={value}
        onChange={onChange}
        selectionChips
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove field Customer email' }));

    expect(onChange).toHaveBeenCalledWith([{ path: 'id', source: 'input' }]);
  });

  it('keeps a picked field the schema no longer lists, so it can be unpicked', async () => {
    const onChange = vi.fn();
    render(
      <GuardrailFilterFieldSelector
        fields={FIELDS}
        value={[{ path: 'legacy.field', source: 'output' }]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('combobox', { name: /Fields to filter/ }));
    const output = within(await screen.findByRole('group', { name: 'Output' }));
    fireEvent.click(output.getByRole('option', { name: 'legacy.field' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('ties its error to the trigger', () => {
    render(
      <GuardrailFilterFieldSelector
        fields={FIELDS}
        value={[]}
        onChange={vi.fn()}
        error="Fields selection is required"
      />
    );

    const trigger = screen.getByRole('combobox', { name: /Fields to filter/ });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAccessibleDescription('Fields selection is required');
  });

  it('takes a partial labels override and resolves the rest', () => {
    render(
      <GuardrailFilterFieldSelector
        fields={FIELDS}
        value={[]}
        onChange={vi.fn()}
        labels={{ filterFieldsLabel: 'Fields to redact' }}
      />
    );

    expect(screen.getByRole('combobox', { name: /Fields to redact/ })).toHaveTextContent(
      'Select fields'
    );
  });

  it('composes into the action section as its filter content', async () => {
    function Composed() {
      const [action, setAction] = useState<GuardrailAction>({ $actionType: 'filter', fields: [] });
      const fields =
        action.$actionType === 'filter' ? (action.fields as GuardrailFieldReference[]) : [];
      return (
        <GuardrailActionSection
          action={action}
          onActionChange={setAction}
          showFilter
          filterContent={
            <GuardrailFilterFieldSelector
              fields={FIELDS}
              value={fields}
              onChange={(next) => setAction({ $actionType: 'filter', fields: next })}
            />
          }
        />
      );
    }
    render(<Composed />);

    fireEvent.click(screen.getByRole('combobox', { name: /Fields to filter/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'Customer email' }));

    expect(screen.getByRole('combobox', { name: /Fields to filter/ })).toHaveTextContent(
      'Customer email'
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GuardrailFilterFieldSelector
        fields={FIELDS}
        value={[{ path: 'customer.email', source: 'input' }]}
        onChange={vi.fn()}
        error="Fields selection is required"
        selectionChips
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
