import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { GuardrailChip } from './guardrail-chip';

describe('GuardrailChip', () => {
  it('renders a pressed toggle button', () => {
    render(<GuardrailChip pressed>Email</GuardrailChip>);
    expect(screen.getByRole('button', { name: 'Email', pressed: true })).toBeInTheDocument();
  });

  it('reports presses', () => {
    const onPressedChange = vi.fn();
    render(
      <GuardrailChip pressed={false} onPressedChange={onPressedChange}>
        Email
      </GuardrailChip>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Email', pressed: false }));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('renders the addable appearance with a dashed border', () => {
    render(
      <GuardrailChip appearance="addable" pressed={false}>
        ToolB
      </GuardrailChip>
    );
    expect(screen.getByRole('button', { name: 'ToolB' })).toHaveClass('border-dashed');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <GuardrailChip pressed>On</GuardrailChip>
        <GuardrailChip appearance="addable" pressed={false}>
          Addable
        </GuardrailChip>
      </>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
