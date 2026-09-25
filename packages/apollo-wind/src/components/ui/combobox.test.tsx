import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';

import { Combobox, ComboboxItem } from './combobox';

const mockItems: ComboboxItem[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('Combobox', () => {
  describe('Rendering', () => {
    it('renders with default placeholder', () => {
      render(<Combobox items={mockItems} />);
      expect(screen.getByRole('combobox')).toHaveTextContent('Select an option...');
    });

    it('renders with custom placeholder', () => {
      render(<Combobox items={mockItems} placeholder="Choose a fruit" />);
      expect(screen.getByRole('combobox')).toHaveTextContent('Choose a fruit');
    });

    it('renders selected value label', () => {
      render(<Combobox items={mockItems} value="banana" />);
      expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
    });

    it('renders disabled state', () => {
      render(<Combobox items={mockItems} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Combobox items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct aria-expanded attribute', async () => {
      const user = userEvent.setup();
      render(<Combobox items={mockItems} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');

      await user.click(combobox);
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      render(<Combobox items={mockItems} className="custom-class" />);
      expect(screen.getByRole('combobox')).toHaveClass('custom-class');
    });

    it('renders custom search placeholder when opened', async () => {
      const user = userEvent.setup();
      render(<Combobox items={mockItems} searchPlaceholder="Find fruit..." />);

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Find fruit...')).toBeInTheDocument();
      });
    });

    it('renders custom empty text when provided', async () => {
      const user = userEvent.setup();
      render(<Combobox items={[]} emptyText="Nothing here" />);

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Nothing here')).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('opens popover on click', async () => {
      const user = userEvent.setup();
      render(<Combobox items={mockItems} />);

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
        expect(screen.getByText('Cherry')).toBeInTheDocument();
      });
    });

    it('calls onValueChange when item is selected', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Combobox items={mockItems} onValueChange={onValueChange} />);

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Banana')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Banana'));
      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith('banana');
      });
    });

    it('closes popover after selection', async () => {
      const user = userEvent.setup();
      render(<Combobox items={mockItems} />);

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Apple'));
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Value vs placeholder color', () => {
    it('mutes the placeholder via its own span', () => {
      render(<Combobox items={mockItems} placeholder="Select an option..." />);
      const placeholder = screen.getByText('Select an option...');
      expect(placeholder.tagName).toBe('SPAN');
      expect(placeholder).toHaveClass('text-foreground-muted');
    });

    it('renders a selected value at full strength', () => {
      render(<Combobox items={mockItems} value="apple" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('Apple');
      expect(trigger.querySelector('.text-foreground-muted')).toBeNull();
    });

    // The outline Button variant mutes its own text in Future themes, so the
    // trigger has to override it rather than rely on removing the class.
    it('overrides the outline variant so the trigger is not globally muted', () => {
      render(<Combobox items={mockItems} />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('future:text-foreground');
      expect(trigger).not.toHaveClass('future:text-muted-foreground');
    });
  });

  describe('Future focus ring', () => {
    it('uses the cyan ring, with the error ring on top', () => {
      render(<Combobox items={mockItems} />);
      expect(screen.getByRole('combobox')).toHaveClass(
        'future:focus-visible:ring-cyan-600',
        'future:aria-invalid:focus-visible:ring-error'
      );
    });

    it('lets consumers override the focus color', () => {
      render(<Combobox items={mockItems} className="future:focus-visible:ring-primary" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('future:focus-visible:ring-primary');
      expect(trigger).not.toHaveClass('future:focus-visible:ring-cyan-600');
    });
  });
});

describe('Combobox inline validation', () => {
  it('renders the message and wires aria attributes to it', () => {
    render(<Combobox id="stage" items={mockItems} error="Select a stage before saving." />);
    const trigger = screen.getByRole('combobox');
    const message = screen.getByText('Select a stage before saving.');

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 'stage-error');
    expect(trigger).toHaveAttribute('aria-errormessage', 'stage-error');
    expect(message).toHaveAttribute('id', 'stage-error');
    expect(message).toHaveClass('text-xs', 'leading-4', 'text-error');
  });

  it('generates a message id when none is provided', () => {
    render(<Combobox items={mockItems} error="Required." />);
    const trigger = screen.getByRole('combobox');
    const message = screen.getByText('Required.');
    expect(message.id).toBeTruthy();
    expect(trigger).toHaveAttribute('aria-describedby', message.id);
  });

  it('preserves an existing description alongside the validation message', () => {
    render(
      <>
        <p id="stage-help">Stages come from the case plan.</p>
        <Combobox id="stage" items={mockItems} aria-describedby="stage-help" error="Required." />
      </>
    );
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-describedby',
      'stage-help stage-error'
    );
  });

  it('renders no message and stays valid without an error', () => {
    render(<Combobox id="stage" items={mockItems} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).not.toHaveAttribute('aria-describedby');
    expect(document.getElementById('stage-error')).toBeNull();
  });

  it('lets a label name the trigger when an id is provided', () => {
    render(
      <>
        <label htmlFor="stage">Stage</label>
        <Combobox id="stage" items={mockItems} />
      </>
    );
    expect(screen.getByRole('combobox', { name: 'Stage' })).toBeInTheDocument();
  });

  it('has no accessibility violations in the error state', async () => {
    const { container } = render(
      <>
        <label htmlFor="stage">Stage</label>
        <Combobox id="stage" items={mockItems} error="Select a stage." />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
describe('Combobox remount safety', () => {
  it('keeps the same trigger node and focus when an error appears', () => {
    const { rerender } = render(<Combobox id="stage" items={mockItems} />);
    const before = screen.getByRole('combobox');
    before.focus();
    expect(before).toHaveFocus();

    rerender(<Combobox id="stage" items={mockItems} error="Select a stage." />);
    const after = screen.getByRole('combobox');

    expect(after).toBe(before);
    expect(after).toHaveFocus();
  });
});
