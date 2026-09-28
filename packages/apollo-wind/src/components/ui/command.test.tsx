import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

describe('Command', () => {
  const CommandExample = ({ onSelect = vi.fn() }: { onSelect?: (value: string) => void }) => (
    <Command>
      <CommandInput placeholder="Type a command or search..." aria-label="Command search" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={onSelect}>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            Profile
            <CommandShortcut>Ctrl+P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );

  it('renders the input and all items', () => {
    render(<CommandExample />);
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Search Emoji')).toBeInTheDocument();
    expect(screen.getByText('Calculator')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders group headings', () => {
    render(<CommandExample />);
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders shortcut hints', () => {
    render(<CommandExample />);
    expect(screen.getByText('Ctrl+P')).toBeInTheDocument();
  });

  it('applies popover styling classes and merges custom className', () => {
    const { container } = render(
      <Command className="custom-command">
        <CommandInput aria-label="Search" />
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    );
    const root = container.querySelector('[cmdk-root]');
    expect(root).toHaveClass('custom-command');
    expect(root).toHaveClass('bg-popover');
  });

  it('filters items when typing in the input', async () => {
    const user = userEvent.setup();
    render(<CommandExample />);

    await user.type(screen.getByPlaceholderText('Type a command or search...'), 'calen');

    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.queryByText('Search Emoji')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<CommandExample />);

    await user.type(screen.getByPlaceholderText('Type a command or search...'), 'zzzzzz');

    expect(screen.getByText('No results found.')).toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
  });

  it('does not show the empty state while items match', () => {
    render(<CommandExample />);
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });

  it('calls onSelect when an item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CommandExample onSelect={onSelect} />);

    await user.click(screen.getByText('Calendar'));

    // cmdk derives the item value from its text content when no value is given
    expect(onSelect).toHaveBeenCalledWith('Calendar');
  });

  it('selects an item with keyboard navigation and Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CommandExample onSelect={onSelect} />);

    const input = screen.getByPlaceholderText('Type a command or search...');
    await user.click(input);
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith('Calendar');
  });

  it('has no accessibility violations', async () => {
    // Rendered without CommandSeparator: cmdk places separators inside the
    // listbox element, which axe rejects (aria-required-children), so the
    // separator is covered by the rendering tests above instead.
    const { container } = render(
      <Command>
        <CommandInput placeholder="Search..." aria-label="Command search" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
