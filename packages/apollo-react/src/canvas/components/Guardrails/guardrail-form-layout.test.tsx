import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { GuardrailFormLayout } from './guardrail-form-layout';

describe('GuardrailFormLayout', () => {
  const baseProps = {
    open: true,
    title: 'Add guardrail',
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  it('inline + hideHeader renders body and footer without a header', () => {
    render(
      <GuardrailFormLayout {...baseProps} inline hideHeader>
        <div data-testid="body" />
      </GuardrailFormLayout>
    );

    expect(screen.getByTestId('body')).toBeInTheDocument();
    expect(screen.queryByText('Add guardrail')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('inline renders a back-button header wired to onCancel', () => {
    const onCancel = vi.fn();
    render(
      <GuardrailFormLayout {...baseProps} inline onCancel={onCancel}>
        <div />
      </GuardrailFormLayout>
    );

    expect(screen.getByText('Add guardrail')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it('modal renders a dialog with title and footer buttons', () => {
    render(
      <GuardrailFormLayout {...baseProps}>
        <div data-testid="body" />
      </GuardrailFormLayout>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add guardrail')).toBeInTheDocument();
    expect(screen.getByTestId('body')).toBeInTheDocument();
  });

  it('modal calls onCancel when the dialog is dismissed', () => {
    const onCancel = vi.fn();
    render(
      <GuardrailFormLayout {...baseProps} onCancel={onCancel}>
        <div />
      </GuardrailFormLayout>
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders the secondary action and honors its disabled state', () => {
    const onSecondary = vi.fn();
    render(
      <GuardrailFormLayout
        {...baseProps}
        inline
        hideHeader
        secondaryAction={{ label: 'Save as new', onClick: onSecondary, disabled: true }}
      >
        <div />
      </GuardrailFormLayout>
    );

    const secondary = screen.getByRole('button', { name: 'Save as new' });
    expect(secondary).toBeDisabled();
  });

  it('disables Save when saveDisabled is set', () => {
    render(
      <GuardrailFormLayout {...baseProps} inline hideHeader saveDisabled>
        <div />
      </GuardrailFormLayout>
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('renders footerStart content in the footer (inline and modal)', () => {
    const { unmount } = render(
      <GuardrailFormLayout
        {...baseProps}
        inline
        hideHeader
        footerStart={<span data-testid="footer-start" />}
      >
        <div />
      </GuardrailFormLayout>
    );
    expect(screen.getByTestId('footer-start')).toBeInTheDocument();
    unmount();

    render(
      <GuardrailFormLayout {...baseProps} footerStart={<span data-testid="footer-start-modal" />}>
        <div />
      </GuardrailFormLayout>
    );
    expect(screen.getByTestId('footer-start-modal')).toBeInTheDocument();
  });

  it('uses label overrides for the buttons', () => {
    render(
      <GuardrailFormLayout
        {...baseProps}
        inline
        hideHeader
        labels={{ cancel: 'Abbrechen', save: 'Speichern' }}
      >
        <div />
      </GuardrailFormLayout>
    );

    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
  });

  it('has no accessibility violations (inline)', async () => {
    const { container } = render(
      <GuardrailFormLayout {...baseProps} inline>
        <p>Body content</p>
      </GuardrailFormLayout>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('modal focus on close', () => {
    const modal = (open: boolean) => (
      <GuardrailFormLayout {...baseProps} open={open}>
        <input aria-label="Name" />
      </GuardrailFormLayout>
    );

    it('returns focus to the element that had it when the modal opened', async () => {
      render(<button type="button">Open builder</button>);
      const trigger = screen.getByRole('button', { name: 'Open builder' });
      trigger.focus();

      const { rerender } = render(modal(true));
      await waitFor(() => expect(trigger).not.toHaveFocus());

      rerender(modal(false));
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('returns focus when the host unmounts the modal instead of closing it', async () => {
      render(<button type="button">Open builder</button>);
      const trigger = screen.getByRole('button', { name: 'Open builder' });
      trigger.focus();

      const { unmount } = render(modal(true));
      await waitFor(() => expect(trigger).not.toHaveFocus());

      unmount();
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('returns focus inside a shadow root, where document.activeElement is the host', async () => {
      const shadowHost = document.createElement('div');
      document.body.appendChild(shadowHost);
      const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
      const trigger = document.createElement('button');
      trigger.textContent = 'Open builder';
      shadowRoot.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(shadowHost);

      const { rerender } = render(modal(true));
      await waitFor(() => expect(shadowRoot.activeElement).not.toBe(trigger));

      rerender(modal(false));
      await waitFor(() => expect(shadowRoot.activeElement).toBe(trigger));
      shadowHost.remove();
    });

    it('leaves focus alone when that element is gone by the time it closes', async () => {
      const { unmount: removeTrigger } = render(<button type="button">Open builder</button>);
      screen.getByRole('button', { name: 'Open builder' }).focus();

      const { rerender } = render(modal(true));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      removeTrigger();

      rerender(modal(false));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(document.activeElement).toBe(document.body);
    });
  });
});
