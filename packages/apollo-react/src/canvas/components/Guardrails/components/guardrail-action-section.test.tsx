import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { type GuardrailAction, GuardrailRecipientType } from '../builder-types';
import { GUARDRAIL_BUILDER_EN_LABELS } from '../i18n';
import { GuardrailActionSection } from './guardrail-action-section';

const labels = GUARDRAIL_BUILDER_EN_LABELS;
const logAction: GuardrailAction = { $actionType: 'log', severityLevel: 'Info' };

describe('GuardrailActionSection', () => {
  it('renders the action type select with the current value', () => {
    render(<GuardrailActionSection action={logAction} onActionChange={vi.fn()} labels={labels} />);

    expect(screen.getByText('Action type')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /action type/i })).toHaveTextContent('Log');
  });

  it('resets the payload when the action type changes', async () => {
    const onActionChange = vi.fn();
    render(
      <GuardrailActionSection action={logAction} onActionChange={onActionChange} labels={labels} />
    );

    fireEvent.click(screen.getByRole('combobox', { name: /action type/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'Block' }));

    expect(onActionChange).toHaveBeenCalledWith({ $actionType: 'block', reason: '' });
  });

  it('offers Filter only when showFilter is set', async () => {
    const { unmount } = render(
      <GuardrailActionSection action={logAction} onActionChange={vi.fn()} labels={labels} />
    );
    fireEvent.click(screen.getByRole('combobox', { name: /action type/i }));
    expect(await screen.findByRole('option', { name: 'Log' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Filter' })).not.toBeInTheDocument();
    unmount();

    render(
      <GuardrailActionSection
        action={logAction}
        onActionChange={vi.fn()}
        showFilter
        labels={labels}
      />
    );
    fireEvent.click(screen.getByRole('combobox', { name: /action type/i }));
    expect(await screen.findByRole('option', { name: 'Filter' })).toBeInTheDocument();
  });

  it('renders the severity select for log actions and reports changes', async () => {
    const onActionChange = vi.fn();
    render(
      <GuardrailActionSection action={logAction} onActionChange={onActionChange} labels={labels} />
    );

    fireEvent.click(screen.getByRole('combobox', { name: /severity level/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'Warning' }));

    expect(onActionChange).toHaveBeenCalledWith({ $actionType: 'log', severityLevel: 'Warning' });
  });

  it('renders the blocking reason input with its error for block actions', () => {
    const onActionChange = vi.fn();
    render(
      <GuardrailActionSection
        action={{ $actionType: 'block', reason: '' }}
        onActionChange={onActionChange}
        errors={{ blockReason: 'Block reason is required' }}
        labels={labels}
      />
    );

    const input = screen.getByLabelText(/blocking reason/i);
    fireEvent.change(input, { target: { value: 'no PII' } });
    expect(onActionChange).toHaveBeenCalledWith({ $actionType: 'block', reason: 'no PII' });
    expect(screen.getByText('Block reason is required')).toBeInTheDocument();
  });

  it('renders filterContent and its error for filter actions', () => {
    render(
      <GuardrailActionSection
        action={{ $actionType: 'filter', fields: [] }}
        onActionChange={vi.fn()}
        showFilter
        filterContent={<div data-testid="filter-slot" />}
        errors={{ filterFields: 'Fields selection is required' }}
        labels={labels}
      />
    );

    expect(screen.getByTestId('filter-slot')).toBeInTheDocument();
    expect(screen.getByText('Fields selection is required')).toBeInTheDocument();
  });

  it('delegates escalate actions to the escalation fields', () => {
    render(
      <GuardrailActionSection
        action={{
          $actionType: 'escalate',
          app: { id: '', version: '', name: '' },
          recipient: { type: GuardrailRecipientType.User, value: '', displayName: '' },
        }}
        onActionChange={vi.fn()}
        labels={labels}
      />
    );

    expect(screen.getByText('Assign to')).toBeInTheDocument();
    expect(screen.getByText('Action App')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GuardrailActionSection action={logAction} onActionChange={vi.fn()} labels={labels} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
