import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { type GuardrailAction, GuardrailRecipientType } from '../builder-types';
import { GUARDRAIL_BUILDER_EN_LABELS } from '../i18n';
import { EscalateActionFields } from './escalate-action-fields';

const labels = GUARDRAIL_BUILDER_EN_LABELS;
type EscalateAction = Extract<GuardrailAction, { $actionType: 'escalate' }>;

function makeAction(overrides?: Partial<EscalateAction>): EscalateAction {
  return {
    $actionType: 'escalate',
    app: { id: '', version: '', name: '' },
    recipient: { type: GuardrailRecipientType.User, value: '', displayName: '' },
    ...overrides,
  };
}

const baseProps = {
  actionTypeSelect: <div data-testid="action-type-cell" />,
  labels,
};

describe('EscalateActionFields', () => {
  it('renders the injected action type cell inside its grid', () => {
    render(<EscalateActionFields {...baseProps} action={makeAction()} onChange={vi.fn()} />);
    expect(screen.getByTestId('action-type-cell')).toBeInTheDocument();
  });

  describe('recipient type switching', () => {
    it.each([
      ['Group', { type: GuardrailRecipientType.Group, value: '', displayName: '' }],
      ['Email address', { type: GuardrailRecipientType.StaticEmail, value: '' }],
      ['Group name', { type: GuardrailRecipientType.StaticGroupName, value: '' }],
    ] as const)('switching to %s resets the recipient payload', async (optionLabel, expectedRecipient) => {
      const onChange = vi.fn();
      render(<EscalateActionFields {...baseProps} action={makeAction()} onChange={onChange} />);

      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(await screen.findByRole('option', { name: optionLabel }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ recipient: expectedRecipient })
      );
    });
  });

  it('uses the renderRecipientSearch slot for user recipients', () => {
    const onChange = vi.fn();
    render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction({
          recipient: { type: GuardrailRecipientType.User, value: 'u1', displayName: 'User One' },
        })}
        onChange={onChange}
        errors={{ recipient: 'Recipient is required' }}
        renderRecipientSearch={(ctx) => (
          <button
            type="button"
            data-testid="directory-search"
            data-kind={ctx.kind}
            data-display={ctx.displayValue}
            data-invalid={ctx.invalid}
            onClick={() => ctx.onSelect({ value: 'u2', displayName: 'User Two' })}
          >
            pick
          </button>
        )}
      />
    );

    const slot = screen.getByTestId('directory-search');
    expect(slot).toHaveAttribute('data-kind', 'user');
    expect(slot).toHaveAttribute('data-display', 'User One');
    expect(slot).toHaveAttribute('data-invalid', 'true');

    fireEvent.click(slot);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: { type: GuardrailRecipientType.User, value: 'u2', displayName: 'User Two' },
      })
    );
  });

  it('falls back to a plain input for user recipients without the slot', () => {
    const onChange = vi.fn();
    render(<EscalateActionFields {...baseProps} action={makeAction()} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search for a user...');
    fireEvent.change(input, { target: { value: 'jane@acme.com' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: {
          type: GuardrailRecipientType.User,
          value: 'jane@acme.com',
          displayName: 'jane@acme.com',
        },
      })
    );
  });

  it('renders a plain input for static email recipients', () => {
    const onChange = vi.fn();
    render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction({ recipient: { type: GuardrailRecipientType.StaticEmail, value: '' } })}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'a@b.c' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: { type: GuardrailRecipientType.StaticEmail, value: 'a@b.c' },
      })
    );
  });

  it('renders the recipient error once, inside the recipient field', () => {
    render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction()}
        onChange={vi.fn()}
        errors={{ recipient: 'Recipient is required' }}
      />
    );

    expect(screen.getAllByText('Recipient is required')).toHaveLength(1);
  });

  it('uses the renderAppPicker slot with app context', () => {
    const onChange = vi.fn();
    render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction({ app: { id: 'a1', version: '1', name: 'My app' } })}
        onChange={onChange}
        errors={{ actionApp: 'Action app is required' }}
        renderAppPicker={(ctx) => (
          <button
            type="button"
            data-testid="app-picker"
            data-label={ctx.label}
            data-error={ctx.error}
            data-app={ctx.app?.name}
            onClick={() => ctx.onChange(null)}
          >
            pick app
          </button>
        )}
      />
    );

    const slot = screen.getByTestId('app-picker');
    expect(slot).toHaveAttribute('data-label', 'Action App');
    expect(slot).toHaveAttribute('data-error', 'Action app is required');
    expect(slot).toHaveAttribute('data-app', 'My app');

    fireEvent.click(slot);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ app: { id: '', version: '', name: '' } })
    );
  });

  it('falls back to the unavailable note without an app picker slot', () => {
    render(<EscalateActionFields {...baseProps} action={makeAction()} onChange={vi.fn()} />);
    expect(screen.getByText(/app picker unavailable/i)).toBeInTheDocument();
  });

  it('renders escalateHelp below the grid', () => {
    render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction()}
        onChange={vi.fn()}
        escalateHelp={<p data-testid="help-line">See the marketplace.</p>}
      />
    );

    expect(screen.getByTestId('help-line')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <EscalateActionFields {...baseProps} action={makeAction()} onChange={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
