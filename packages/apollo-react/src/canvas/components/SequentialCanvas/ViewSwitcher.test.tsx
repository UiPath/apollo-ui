import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ViewSwitcher } from './ViewSwitcher';

describe('ViewSwitcher', () => {
  it('renders both view options and calls onChange when the other is picked', () => {
    const onChange = vi.fn();
    render(<ViewSwitcher value="flow" onChange={onChange} />);

    expect(screen.getByRole('radio', { name: 'Flow' })).toBeInTheDocument();
    const sequential = screen.getByRole('radio', { name: 'Sequential' });
    fireEvent.click(sequential);
    expect(onChange).toHaveBeenCalledWith('sequential');
  });
});
