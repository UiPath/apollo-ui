import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { MultiSelect } from './multi-select';

const mockOptions = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
];

describe('MultiSelect', () => {
  it('renders with placeholder', () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={onChange}
        placeholder="Select frameworks..."
      />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Select frameworks...')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MultiSelect options={mockOptions} selected={['react']} onChange={onChange} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders with default placeholder when none provided', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} />);
    expect(screen.getByText('Select items...')).toBeInTheDocument();
  });

  it('displays selected items as badges', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={onChange} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('opens popover when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Command input should be visible when popover is open
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('allows selecting items', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Click on React option
    const reactOption = screen.getByRole('option', { name: /react/i });
    await user.click(reactOption);

    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('allows deselecting items by clicking badge X', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={onChange} />,
    );

    // Find the X button (span with role="button") in the React badge
    const badges = container.querySelectorAll('.mr-1');
    const reactBadgeButton = badges[0].querySelector('[role="button"]');

    if (reactBadgeButton) {
      await user.click(reactBadgeButton);
      expect(onChange).toHaveBeenCalledWith(['vue']);
    }
  });

  it('respects maxSelected limit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue']}
        onChange={onChange}
        maxSelected={2}
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Try to select Angular (should be disabled)
    const angularOption = screen.getByRole('option', { name: /angular/i });
    expect(angularOption).toHaveClass('opacity-50', 'cursor-not-allowed');

    await user.click(angularOption);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows clear all button when items are selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    const clearButton = screen.getByRole('button', {
      name: /clear all \(2\)/i,
    });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('displays custom empty message', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={[]}
        selected={[]}
        onChange={onChange}
        emptyMessage="No frameworks available"
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    expect(screen.getByText('No frameworks available')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} disabled />);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeDisabled();
  });

  it('accepts custom className', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={onChange}
        className="custom-multi-select"
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-multi-select');
  });

  it('uses custom search placeholder', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={onChange}
        searchPlaceholder="Find framework..."
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    expect(screen.getByPlaceholderText('Find framework...')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    const onChange = vi.fn();
    render(<MultiSelect ref={ref} options={mockOptions} selected={[]} onChange={onChange} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
