import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Command as CommandPrimitive } from 'cmdk';
import { axe } from 'jest-axe';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Search, SearchWithSuggestions } from './search';

describe('Search', () => {
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

    expect(handleChange).toHaveBeenLastCalledWith('test query');
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

  it.each([
    ['test', true, true],
    ['', true, false],
    ['test', false, false],
  ])('value=%j showClearButton=%s renders clear: %s', (value, showClearButton, visible) => {
    render(<Search value={value} onChange={vi.fn()} showClearButton={showClearButton} />);
    expect(!!screen.queryByRole('button', { name: 'Clear' })).toBe(visible);
  });

  it('clears and calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleClear = vi.fn();
    render(<Search value="test" onChange={handleChange} onClear={handleClear} />);

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(handleChange).toHaveBeenCalledWith('');
    expect(handleClear).toHaveBeenCalled();
  });

  it('labels the clear button from strings', () => {
    render(<Search value="test" onChange={vi.fn()} strings={{ clear: 'Suche löschen' }} />);
    expect(screen.getByRole('button', { name: 'Suche löschen' })).toBeInTheDocument();
  });

  it('passes strings through SearchWithSuggestions', async () => {
    const user = userEvent.setup();
    render(<SearchWithSuggestions strings={{ clear: 'Suche löschen' }} />);
    await user.type(screen.getByRole('searchbox'), 'inv');
    expect(screen.getByRole('button', { name: 'Suche löschen' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Search className="custom-search" />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveClass('custom-search');
  });

  it('suppresses the native search clear button to avoid a duplicate', () => {
    render(<Search value="test" onChange={vi.fn()} />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveClass('[&::-webkit-search-cancel-button]:appearance-none');
    expect(input).toHaveClass('[&::-webkit-search-decoration]:appearance-none');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Search ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('returns focus to the input after clearing', async () => {
    const user = userEvent.setup();
    render(<Search value="test" onValueChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('passes the string to onValueChange and the native event to onChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(<Search onValueChange={onValueChange} onChange={onChange} />);

    await user.type(screen.getByRole('searchbox'), 'a');

    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(onChange.mock.calls[0][0].target.value).toBe('a');
  });

  it('clears through a native change event', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const eventValues: string[] = [];
    render(
      <Search
        value="test"
        onValueChange={onValueChange}
        onChange={(e) => eventValues.push(e.target.value)}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onValueChange).toHaveBeenCalledWith('');
    expect(eventValues).toEqual(['']);
  });
});

describe('Search under cmdk Command.Input asChild', () => {
  function Picker() {
    const [query, setQuery] = React.useState('');
    return (
      <CommandPrimitive label="Fruits">
        <CommandPrimitive.Input asChild>
          <Search aria-label="Search fruits" value={query} onValueChange={setQuery} />
        </CommandPrimitive.Input>
        <CommandPrimitive.List>
          <CommandPrimitive.Item>Apple</CommandPrimitive.Item>
          <CommandPrimitive.Item>Banana</CommandPrimitive.Item>
        </CommandPrimitive.List>
      </CommandPrimitive>
    );
  }

  it('gets combobox wiring and tracks the highlighted row', async () => {
    const user = userEvent.setup();
    render(<Picker />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'a');
    await user.keyboard('{ArrowDown}');

    const selected = screen.getAllByRole('option').find((o) => o.dataset.selected === 'true');
    expect(selected).toBeDefined();
    expect(selected?.id).toBeTruthy();
    expect(input).toHaveAttribute('aria-activedescendant', selected?.id);
  });

  it('filters while typing and resets the filter on clear', async () => {
    const user = userEvent.setup();
    render(<Picker />);

    await user.type(screen.getByRole('combobox'), 'ban');
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
  });
});

describe('SearchWithSuggestions', () => {
  const suggestions = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

  async function openWith(query: string, match: string) {
    const user = userEvent.setup();
    render(<SearchWithSuggestions suggestions={suggestions} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, query);
    await screen.findByText(match);
    return { user, input };
  }

  it('displays placeholder text', () => {
    render(<SearchWithSuggestions placeholder="Search fruits..." suggestions={suggestions} />);
    expect(screen.getByPlaceholderText('Search fruits...')).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    await openWith('app', 'Apple');
  });

  it('shows all suggestions when the empty input is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchWithSuggestions suggestions={suggestions} />);

    await user.click(screen.getByRole('searchbox'));

    expect(await screen.findAllByRole('option')).toHaveLength(suggestions.length);
    for (const suggestion of suggestions) {
      expect(screen.getByRole('option', { name: suggestion })).toBeInTheDocument();
    }
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('reopens all suggestions when the input is clicked after clearing', async () => {
    const { user, input } = await openWith('app', 'Apple');

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(input);

    expect(await screen.findAllByRole('option')).toHaveLength(suggestions.length);
    for (const suggestion of suggestions) {
      expect(screen.getByRole('option', { name: suggestion })).toBeInTheDocument();
    }
  });

  it('calls onSelect when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<SearchWithSuggestions suggestions={suggestions} onSelect={handleSelect} />);

    await user.type(screen.getByRole('searchbox'), 'app');
    await user.click(await screen.findByText('Apple'));
    expect(handleSelect).toHaveBeenCalledWith('Apple');
  });

  it('updates input value when suggestion is selected', async () => {
    const { user, input } = await openWith('app', 'Apple');
    await user.click(screen.getByText('Apple'));
    await waitFor(() => expect(input).toHaveValue('Apple'));
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchWithSuggestions className="custom-search" suggestions={suggestions} />
    );
    expect(container.querySelector('.custom-search')).toBeInTheDocument();
  });

  it('keeps focus in the input while suggestions open', async () => {
    const { input } = await openWith('an', 'Banana');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('an');
  });

  it('stays open when clicking back into the input', async () => {
    const { user, input } = await openWith('an', 'Banana');
    await user.click(input);

    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('reopens on click after Escape while a query remains', async () => {
    const { user, input } = await openWith('an', 'Banana');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Banana')).not.toBeInTheDocument());

    await user.click(input);

    expect(await screen.findByText('Banana')).toBeInTheDocument();
  });

  it('links the input to the suggestions popup while open', async () => {
    const user = userEvent.setup();
    render(<SearchWithSuggestions suggestions={suggestions} />);
    const input = screen.getByRole('searchbox');

    expect(input).toHaveAttribute('aria-haspopup', 'dialog');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-controls');

    await user.type(input, 'an');
    await screen.findByText('Banana');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    const popupId = input.getAttribute('aria-controls');
    expect(popupId).toBeTruthy();
    expect(document.getElementById(popupId as string)).toHaveAttribute('role', 'dialog');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<SearchWithSuggestions ref={ref} suggestions={suggestions} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Search inline validation', () => {
  it('forwards error to the group so the field is marked invalid and described', () => {
    render(
      <Search aria-label="Search" value="ab" onChange={() => {}} error="Enter 3 characters." />
    );
    const input = screen.getByRole('searchbox');
    const message = screen.getByText('Enter 3 characters.');

    expect(message.id).toBeTruthy();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', message.id);
    expect(input).toHaveAttribute('aria-errormessage', message.id);
    expect(message).toHaveClass('text-error');
  });

  it('uses errorId for the message when provided', () => {
    render(<Search aria-label="Search" error="Required." errorId="q-error" />);
    expect(screen.getByText('Required.')).toHaveAttribute('id', 'q-error');
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-describedby', 'q-error');
  });
});
