import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '../tooltip';
import { AiAssistAction } from './ai-assist-action';

describe('AiAssistAction', () => {
  it('reports the entered prompt', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    render(
      <TooltipProvider>
        <AiAssistAction onGenerate={onGenerate} hint="Output: string value" />
      </TooltipProvider>
    );

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    expect(screen.getByText('Output: string value')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Describe what you want'), 'the order id');
    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(onGenerate).toHaveBeenCalledWith('the order id');
  });

  it('cannot be opened while disabled', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <AiAssistAction onGenerate={vi.fn()} disabled />
      </TooltipProvider>
    );
    const trigger = screen.getByRole('button', { name: 'AI assist' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByLabelText('Describe what you want')).toBeNull();
  });

  it('takes translated strings', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <AiAssistAction strings={{ trigger: 'Assistant IA', generate: 'Générer' }} />
      </TooltipProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Assistant IA' }));
    expect(screen.getByRole('button', { name: 'Générer' })).toBeDisabled();
  });

  describe('with a promise', () => {
    const renderPrompt = (onGenerate: (prompt: string) => PromiseLike<unknown>) =>
      render(
        <TooltipProvider>
          <AiAssistAction onGenerate={onGenerate} />
        </TooltipProvider>
      );

    it('stays busy while the promise is pending, then closes', async () => {
      const user = userEvent.setup();
      let resolve!: () => void;
      renderPrompt(
        () =>
          new Promise<void>((r) => {
            resolve = r;
          })
      );

      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      const busy = screen.getByRole('button', { name: 'Generating' });
      expect(busy).toBeDisabled();
      expect(busy).toHaveAttribute('aria-busy', 'true');

      resolve();
      await waitFor(() => expect(screen.queryByLabelText('Describe what you want')).toBeNull());
    });

    it('stays open with the prompt intact when the promise rejects', async () => {
      const user = userEvent.setup();
      renderPrompt(() => Promise.reject(new Error('quota')));

      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      await user.type(screen.getByLabelText('Describe what you want'), 'the order id');
      await user.click(screen.getByRole('button', { name: 'Generate' }));

      expect(await screen.findByRole('button', { name: 'Generate' })).toBeEnabled();
      expect(screen.getByLabelText('Describe what you want')).toHaveValue('the order id');
      expect(screen.getByRole('alert')).toHaveTextContent('Could not generate a value. Try again.');
    });

    it('treats any thenable as pending', async () => {
      const user = userEvent.setup();
      // biome-ignore lint/suspicious/noThenProperty: a promise-like that is not a Promise
      renderPrompt(() => ({ then: () => {} }));

      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      expect(screen.getByRole('button', { name: 'Generating' })).toBeDisabled();
    });
  });
});
