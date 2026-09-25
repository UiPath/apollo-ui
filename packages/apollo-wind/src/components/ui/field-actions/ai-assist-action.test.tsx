import { render, screen } from '@testing-library/react';
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
});
