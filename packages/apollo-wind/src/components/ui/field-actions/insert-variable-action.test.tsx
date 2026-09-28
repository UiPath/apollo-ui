import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InsertVariableAction } from './insert-variable-action';

describe('InsertVariableAction', () => {
  const variables = [{ label: 'Order id', value: '$vars.orderId' }];

  it('is disabled with nothing to insert or nowhere to insert it', () => {
    const { rerender } = render(<InsertVariableAction variables={[]} onInsert={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();

    rerender(<InsertVariableAction variables={variables} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('is enabled once it has both', () => {
    render(<InsertVariableAction variables={variables} onInsert={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeEnabled();
  });

  it('takes translated strings', () => {
    render(
      <InsertVariableAction
        variables={variables}
        onInsert={vi.fn()}
        strings={{ label: 'Insérer', ariaLabel: 'Insérer une variable' }}
      />
    );
    const trigger = screen.getByRole('button', { name: 'Insérer une variable' });
    expect(trigger).toHaveAttribute('title', 'Insérer une variable');
    expect(trigger).toHaveTextContent('Insérer');
  });
});
