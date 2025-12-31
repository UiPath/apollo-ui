import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Search, SearchWithSuggestions } from './search';

describe('Search', () => {
  it('renders without crashing', () => {
    render(<Search />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Search aria-label="Search" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('displays placeholder text', () => {
    render(<Search placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Search onChange={handleChange} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'test query');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test query');
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { rerender } = render(<Search value="initial" onChange={handleChange} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('initial');

    await user.type(input, ' text');
    expect(handleChange).toHaveBeenCalled();

    rerender(<Search value="initial text" onChange={handleChange} />);
    expect(input).toHaveValue('initial text');
  });

  it('displays search icon', () => {
    const { container } = render(<Search />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('displays clear button when value is present', () => {
    render(<Search value="test" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('does not display clear button when value is empty', () => {
    render(<Search value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Search value="test" onChange={handleChange} />);

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    render(<Search value="test" onChange={vi.fn()} onClear={handleClear} />);

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearButton);

    expect(handleClear).toHaveBeenCalled();
  });

  it('can hide clear button', () => {
    render(<Search value="test" onChange={vi.fn()} showClearButton={false} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Search className="custom-search" />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveClass('custom-search');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Search ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe('SearchWithSuggestions', () => {
  const suggestions = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

  it('renders without crashing', () => {
    render(<SearchWithSuggestions suggestions={suggestions} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<SearchWithSuggestions placeholder="Search fruits..." suggestions={suggestions} />);
    expect(screen.getByPlaceholderText('Search fruits...')).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<SearchWithSuggestions suggestions={suggestions} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'app');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  it('calls onSelect when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<SearchWithSuggestions suggestions={suggestions} onSelect={handleSelect} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'app');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Apple'));
    expect(handleSelect).toHaveBeenCalledWith('Apple');
  });

  it('updates input value when suggestion is selected', async () => {
    const user = userEvent.setup();
    render(<SearchWithSuggestions suggestions={suggestions} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'app');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Apple'));

    await waitFor(() => {
      expect(input).toHaveValue('Apple');
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchWithSuggestions className="custom-search" suggestions={suggestions} />,
    );
    expect(container.querySelector('.custom-search')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<SearchWithSuggestions ref={ref} suggestions={suggestions} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
