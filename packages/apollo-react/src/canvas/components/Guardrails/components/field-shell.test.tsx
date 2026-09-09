import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldShell } from './field-shell';

describe('FieldShell', () => {
  it('renders the error border only when invalid', () => {
    const { rerender } = render(<FieldShell data-testid="shell" />);
    expect(screen.getByTestId('shell')).not.toHaveClass('border-error');

    rerender(<FieldShell data-testid="shell" invalid />);
    expect(screen.getByTestId('shell')).toHaveClass('border-error');
  });
});
