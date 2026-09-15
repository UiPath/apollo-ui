import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import type { GuardrailEscalateAction } from '../builder-types';
import { GuardrailRecipientType } from '../builder-types';
import { GUARDRAIL_BUILDER_EN_LABELS } from '../i18n';
import { EscalateActionFields } from './escalate-action-fields';

const labels = GUARDRAIL_BUILDER_EN_LABELS;
type EscalateAction = GuardrailEscalateAction;

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

  describe('recipient error ownership', () => {
    // The sibling FormFieldError used to render outside the slot/fallback ternary, so a host
    // rendering ctx.error itself showed the message twice.
    it('renders the message once when a search slot renders it itself', () => {
      render(
        <EscalateActionFields
          {...baseProps}
          action={makeAction()}
          onChange={vi.fn()}
          errors={{ recipient: 'Recipient is required' }}
          renderRecipientSearch={(ctx) => <div data-testid="search-slot">{ctx.error}</div>}
        />
      );

      expect(screen.getAllByText('Recipient is required')).toHaveLength(1);
      expect(screen.getByTestId('search-slot')).toHaveTextContent('Recipient is required');
    });

    it('renders the message once when a static slot renders it itself', () => {
      render(
        <EscalateActionFields
          {...baseProps}
          action={makeAction({
            recipient: { type: GuardrailRecipientType.StaticEmail, value: '' },
          })}
          onChange={vi.fn()}
          errors={{ recipient: 'Recipient is required' }}
          renderStaticRecipient={(ctx) => <div data-testid="static-slot">{ctx.error}</div>}
        />
      );

      expect(screen.getAllByText('Recipient is required')).toHaveLength(1);
      expect(screen.getByTestId('static-slot')).toHaveTextContent('Recipient is required');
    });

    // The searchable fallback set aria-invalid by hand next to a bare message, so nothing tied
    // the two together. Input's `error` prop wires the association.
    it('associates the message with the input in the searchable fallback', () => {
      render(
        <EscalateActionFields
          {...baseProps}
          action={makeAction()}
          onChange={vi.fn()}
          errors={{ recipient: 'Recipient is required' }}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');

      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy as string)).toHaveTextContent(
        'Recipient is required'
      );
      expect(input).toHaveAttribute('aria-errormessage', describedBy as string);
    });
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

describe('renderStaticRecipient slot', () => {
  it('mounts the slot for static recipients and lets it replace the recipient wholesale', () => {
    const onChange = vi.fn();
    const action = makeAction({
      recipient: { type: GuardrailRecipientType.StaticEmail, value: 'a@b.c' },
    });

    render(
      <EscalateActionFields
        {...baseProps}
        action={action}
        onChange={onChange}
        renderStaticRecipient={(ctx) => (
          <button
            type="button"
            data-testid="static-slot"
            data-kind={ctx.kind}
            onClick={() =>
              ctx.onChange({
                type: GuardrailRecipientType.AssetEmail,
                assetName: 'EmailAsset',
              })
            }
          >
            {ctx.label}
          </button>
        )}
      />
    );

    const slot = screen.getByTestId('static-slot');
    expect(slot).toHaveAttribute('data-kind', 'email');
    fireEvent.click(slot);
    expect(onChange).toHaveBeenCalledWith({
      ...action,
      recipient: { type: GuardrailRecipientType.AssetEmail, assetName: 'EmailAsset' },
    });
  });

  it('falls through to the built-in input when the slot returns undefined', () => {
    const onChange = vi.fn();
    const action = makeAction({
      recipient: { type: GuardrailRecipientType.StaticGroupName, value: '' },
    });

    render(
      <EscalateActionFields
        {...baseProps}
        action={action}
        onChange={onChange}
        renderStaticRecipient={() => undefined}
      />
    );

    const input = screen.getByPlaceholderText(labels.groupNamePlaceholder);
    fireEvent.change(input, { target: { value: 'Ops' } });
    expect(onChange).toHaveBeenCalledWith({
      ...action,
      recipient: { type: GuardrailRecipientType.StaticGroupName, value: 'Ops' },
    });
  });

  it('is not invoked for searchable (user/group) recipients', () => {
    const renderStaticRecipient = vi.fn();
    render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction()}
        onChange={() => {}}
        renderStaticRecipient={renderStaticRecipient}
      />
    );
    expect(renderStaticRecipient).not.toHaveBeenCalled();
  });
});

describe('asset recipient variants', () => {
  it('displays an asset recipient as its static sibling in the type select', () => {
    render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction({
          recipient: { type: GuardrailRecipientType.AssetGroupName, assetName: 'GroupAsset' },
        })}
        onChange={() => {}}
      />
    );

    expect(
      screen.getByRole('combobox', {
        name: `${labels.assignToLabel}: ${labels.recipientGroupNameLabel}`,
      })
    ).toBeInTheDocument();
  });

  it('edits assetName through the built-in fallback input', () => {
    const onChange = vi.fn();
    const action = makeAction({
      recipient: { type: GuardrailRecipientType.AssetEmail, assetName: 'Old' },
    });

    render(<EscalateActionFields {...baseProps} action={action} onChange={onChange} />);

    const input = screen.getByPlaceholderText(labels.emailPlaceholder);
    expect(input).toHaveValue('Old');
    fireEvent.change(input, { target: { value: 'New' } });
    expect(onChange).toHaveBeenCalledWith({
      ...action,
      recipient: { type: GuardrailRecipientType.AssetEmail, assetName: 'New' },
    });
  });
});

// Standalone use (the custom-rules builder path): the leading grid cell and the labels are
// both optional, and `asGridItems` hands the cells to a surrounding grid.
describe('standalone layouts', () => {
  it('renders the three fields stacked without an action type cell', () => {
    const { container } = render(
      <EscalateActionFields
        action={makeAction()}
        onChange={vi.fn()}
        escalateHelp={<p>Marketplace help</p>}
      />
    );

    const root = container.querySelector('[data-slot="guardrail-escalate-fields"]');
    expect(root).toHaveClass('space-y-3');
    expect(root).not.toHaveClass('@container');
    // The three cells are the root's own children: no grid wrapper between them.
    const cells = Array.from(root?.children ?? []).filter(
      (el) => el.getAttribute('data-slot') === 'form-field'
    );
    expect(cells).toHaveLength(3);
    expect(screen.getByText('Assign to')).toBeInTheDocument();
    expect(screen.getByText('Marketplace help')).toBeInTheDocument();
  });

  it('emits bare cells for a surrounding grid with asGridItems', () => {
    const { container } = render(
      <EscalateActionFields
        action={makeAction()}
        onChange={vi.fn()}
        asGridItems
        className="ignored"
        escalateHelp={<p>Marketplace help</p>}
      />
    );

    expect(container.querySelector('[data-slot="guardrail-escalate-fields"]')).toBeNull();
    expect(screen.getByText('Assign to')).toBeInTheDocument();
    // The host owns the layout in this mode, so it also places the help line itself.
    expect(screen.queryByText('Marketplace help')).not.toBeInTheDocument();
  });

  it('keeps the grid layout when both actionTypeSelect and asGridItems are given', () => {
    const { container } = render(
      <EscalateActionFields {...baseProps} action={makeAction()} onChange={vi.fn()} asGridItems />
    );

    expect(screen.getByTestId('action-type-cell')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="guardrail-escalate-fields"]')).toHaveClass(
      '@container'
    );
  });

  it('renders with no labels prop at all', () => {
    render(<EscalateActionFields action={makeAction()} onChange={vi.fn()} />);

    expect(screen.getByText('Assign to')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for a user...')).toBeInTheDocument();
    expect(screen.getByText('Action App')).toBeInTheDocument();
  });

  it('takes a partial labels override and resolves the rest', () => {
    render(
      <EscalateActionFields
        action={makeAction()}
        onChange={vi.fn()}
        labels={{ assignToLabel: 'Escalate to' }}
      />
    );

    expect(screen.getByText('Escalate to')).toBeInTheDocument();
    expect(screen.getByText('Action App')).toBeInTheDocument();
  });

  it('merges className onto its root', () => {
    const { container } = render(
      <EscalateActionFields
        {...baseProps}
        action={makeAction()}
        onChange={vi.fn()}
        className="pt-3"
      />
    );

    expect(container.querySelector('[data-slot="guardrail-escalate-fields"]')).toHaveClass(
      '@container',
      'pt-3'
    );
  });

  it('has no accessibility violations stacked', async () => {
    const { container } = render(<EscalateActionFields action={makeAction()} onChange={vi.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
