import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ApI18nProvider } from '../../../i18n';
import { GuardrailRemoveDialog } from './guardrail-remove-dialog';

const SCOPE_LABELS: Record<string, string> = {
  Agent: 'Agent',
  Llm: 'LLM calls',
  Tool: 'Tools',
};
const formatScope = (scope: string) => SCOPE_LABELS[scope] ?? scope;

const baseProps = {
  open: true,
  guardrailName: 'PII detection 1',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('GuardrailRemoveDialog', () => {
  it('renders nothing while closed', () => {
    render(<GuardrailRemoveDialog {...baseProps} open={false} />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('asks the question with the guardrail name and shows no impact for a plain removal', () => {
    render(<GuardrailRemoveDialog {...baseProps} />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Remove guardrail')).toBeInTheDocument();
    expect(
      screen.getByText('Please, confirm you’d like to remove "PII detection 1" guardrail')
    ).toBeInTheDocument();
    expect(screen.queryByText('This guardrail is also applicable to:')).not.toBeInTheDocument();
    expect(screen.queryByText('It will still be applicable to:')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists what a full removal also takes the guardrail off', () => {
    render(
      <GuardrailRemoveDialog
        {...baseProps}
        affectedToolNames={['Send email', 'Fetch invoice']}
        affectedScopes={['Llm']}
        formatScope={formatScope}
      />
    );

    expect(screen.getByText('This guardrail is also applicable to:')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Send email',
      'Fetch invoice',
      'LLM calls',
    ]);
    expect(screen.queryByText('It will still be applicable to:')).not.toBeInTheDocument();
  });

  it('names the tool and lists what survives a scoped removal', () => {
    render(
      <GuardrailRemoveDialog
        {...baseProps}
        toolName="Send email"
        remainingToolNames={['Fetch invoice']}
        remainingScopes={['Agent']}
        formatScope={formatScope}
      />
    );

    expect(
      screen.getByText('The guardrail will be removed for tool "Send email".')
    ).toBeInTheDocument();
    expect(screen.getByText('It will still be applicable to:')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Fetch invoice',
      'Agent',
    ]);
    expect(screen.queryByText('This guardrail is also applicable to:')).not.toBeInTheDocument();
  });

  it('omits the scoped-removal line when nothing remains, even with a tool in context', () => {
    // Agents' "case 3": the tool was the last one and there are no other scopes, so the
    // guardrail is gone everywhere and naming one tool would misdescribe the removal.
    render(<GuardrailRemoveDialog {...baseProps} toolName="Send email" />);

    expect(
      screen.queryByText('The guardrail will be removed for tool "Send email".')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('It will still be applicable to:')).not.toBeInTheDocument();
  });

  it('still lists what remains when the host gives no tool in context', () => {
    render(<GuardrailRemoveDialog {...baseProps} remainingScopes={['Agent']} />);

    expect(screen.getByText('It will still be applicable to:')).toBeInTheDocument();
    expect(screen.queryByText(/will be removed for tool/)).not.toBeInTheDocument();
  });

  it('renders raw scope values when the host passes no formatter', () => {
    render(<GuardrailRemoveDialog {...baseProps} affectedScopes={['Llm']} />);

    expect(screen.getByRole('listitem')).toHaveTextContent('Llm');
  });

  it('renders both impact blocks when the host fills both', () => {
    render(
      <GuardrailRemoveDialog
        {...baseProps}
        toolName="Send email"
        affectedScopes={['Llm']}
        remainingToolNames={['Fetch invoice']}
        formatScope={formatScope}
      />
    );

    expect(screen.getByText('This guardrail is also applicable to:')).toBeInTheDocument();
    expect(screen.getByText('It will still be applicable to:')).toBeInTheDocument();
    expect(screen.getAllByRole('list')).toHaveLength(2);
  });

  it('confirms exactly once, without also reporting a cancel', () => {
    // Radix's own action button is a close button, so a confirm would drive `onOpenChange`
    // as well and report both intents. Flow's dialog does that today.
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<GuardrailRemoveDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('styles the confirm button with the accent variant, not the destructive one', () => {
    // Pinned because it shipped destructive and was changed back: both hosts reported the red
    // as a regression against the blue accent they use for this action today. A reviewer
    // reaching for `variant="destructive"` again should have to delete this test first.
    render(<GuardrailRemoveDialog {...baseProps} />);

    const remove = screen.getByRole('button', { name: 'Remove' });
    expect(remove).toHaveClass('bg-primary');
    expect(remove).not.toHaveClass('bg-destructive');
  });

  it('cancels exactly once from the Cancel button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<GuardrailRemoveDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels on Escape', () => {
    const onCancel = vi.fn();
    render(<GuardrailRemoveDialog {...baseProps} onCancel={onCancel} />);

    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('opens with focus on Cancel and traps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(<GuardrailRemoveDialog {...baseProps} />);

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const remove = screen.getByRole('button', { name: 'Remove' });
    // The least destructive control takes focus, which is what an alert dialog owes a
    // keyboard user about to delete something.
    expect(cancel).toHaveFocus();

    await user.tab();
    expect(remove).toHaveFocus();

    // Past the last control focus wraps back inside instead of escaping to the page.
    await user.tab();
    expect(cancel).toHaveFocus();
  });

  it('portals into the container it is given', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    render(<GuardrailRemoveDialog {...baseProps} container={host} />);

    expect(host.querySelector('[data-slot="alert-dialog-content"]')).not.toBeNull();
    host.remove();
  });

  it('takes per-string label overrides over the English defaults', () => {
    render(
      <GuardrailRemoveDialog
        {...baseProps}
        labels={{ title: 'Delete guardrail', remove: 'Delete' }}
      />
    );

    expect(screen.getByText('Delete guardrail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('interpolates into a localized template from the canvas catalog', async () => {
    // The two-stage convention: lingui resolves the ICU `{name}` against sentinel values, so
    // the catalog string comes back carrying `{{name}}`, and the component formats that. A
    // catalog entry whose placeholder is spelled differently would silently render the token.
    render(
      <ApI18nProvider component="canvas" locale="ja">
        <GuardrailRemoveDialog {...baseProps} toolName="Send email" remainingScopes={['Agent']} />
      </ApI18nProvider>
    );

    expect(
      await screen.findByText('ガードレール「PII detection 1」の削除を確定してください。')
    ).toBeInTheDocument();
    expect(
      screen.getByText('ツール「Send email」のガードレールが削除されます。')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    render(
      <GuardrailRemoveDialog
        {...baseProps}
        toolName="Send email"
        affectedScopes={['Llm']}
        remainingToolNames={['Fetch invoice']}
        remainingScopes={['Agent']}
        formatScope={formatScope}
      />
    );

    const results = await axe(screen.getByRole('alertdialog'));
    expect(results).toHaveNoViolations();
  });
});
