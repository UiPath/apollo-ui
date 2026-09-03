import type { HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import { EditableText } from './EditableText';

// Stand in for the real overflow detection, which needs layout jsdom does not do.
vi.mock('../CanvasTooltip', async () => {
  const React = await import('react');

  return {
    CanvasTooltip: ({ content, children }: { content: ReactNode; children: ReactNode }) =>
      React.isValidElement(children)
        ? React.cloneElement(children, {
            'data-tooltip-trigger': typeof content === 'string' ? content : 'true',
          } as HTMLAttributes<HTMLElement>)
        : children,
  };
});

describe('EditableText', () => {
  it('renders static text with no interactive affordance when onChange is omitted', () => {
    render(<EditableText value="End" />);
    expect(screen.getByText('End')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the placeholder in place of an empty value', () => {
    render(<EditableText value="" placeholder="Control" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Control' })).toBeInTheDocument();
  });

  it('enters edit mode on a single click and selects the current value', async () => {
    const user = userEvent.setup();
    render(<EditableText value="End" onChange={vi.fn()} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));

    const input = screen.getByRole('textbox', { name: /^Node name/ });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('End');
    expect((input as HTMLInputElement).selectionStart).toBe(0);
    expect((input as HTMLInputElement).selectionEnd).toBe(3);
  });

  it('commits the new value on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableText value="End" onChange={onChange} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('Wrap up');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('commits on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <EditableText value="End" onChange={onChange} aria-label="Node name" />
        <button type="button">elsewhere</button>
      </>
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up');
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('Wrap up');
  });

  it('reverts on Escape without committing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableText value="End" onChange={onChange} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^Node name/ })).toHaveTextContent('End');
  });

  it('trims the committed value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableText value="End" onChange={onChange} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('  Wrap up  {Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('Wrap up');
  });

  it('commits an empty string when the value is cleared, so the caller can delete it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableText value="End" onChange={onChange} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('{Backspace}{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('');
  });

  it('does not fire onChange when the value is unchanged', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableText value="End" onChange={onChange} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps keystrokes from reaching an ancestor while editing', async () => {
    const user = userEvent.setup();
    const onAncestorKeyDown = vi.fn();
    render(
      <div onKeyDown={onAncestorKeyDown}>
        <EditableText value="End" onChange={vi.fn()} aria-label="Node name" />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('x{Escape}');

    expect(onAncestorKeyDown).not.toHaveBeenCalled();
  });

  it('picks up an external value change while not editing', () => {
    const { rerender } = render(
      <EditableText value="End" onChange={vi.fn()} aria-label="Node name" />
    );
    rerender(<EditableText value="Finish" onChange={vi.fn()} aria-label="Node name" />);
    expect(screen.getByRole('button', { name: /^Node name/ })).toHaveTextContent('Finish');
  });
  it('announces the value through the trigger, not only the field name', () => {
    render(<EditableText value="End" onChange={vi.fn()} aria-label="Node name" />);
    expect(screen.getByRole('button', { name: 'Node name: End' })).toBeInTheDocument();
  });

  it('keeps the draft when the parent re-renders with a new value mid-edit', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EditableText value="End" onChange={vi.fn()} aria-label="Node name" />
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up');
    rerender(<EditableText value="Finish" onChange={vi.fn()} aria-label="Node name" />);

    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Wrap up');
  });

  it('reopens the editor on the current value after a commit the caller ignores', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableText value="End" onChange={onChange} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up{Enter}');
    await user.click(screen.getByRole('button', { name: /^Node name/ }));

    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('End');
  });

  it('commits an empty string for whitespace-only input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableText value="End" onChange={onChange} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('   {Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('');
  });

  it('does not commit after Escape when focus moves elsewhere', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <EditableText value="End" onChange={onChange} aria-label="Node name" />
        <button type="button">elsewhere</button>
      </>
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up{Escape}');
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  describe('overflow tooltip', () => {
    it('offers the full value as a tooltip on the read trigger', () => {
      render(<EditableText value="A very long description" onChange={vi.fn()} />);

      expect(screen.getByRole('button')).toHaveAttribute(
        'data-tooltip-trigger',
        'A very long description'
      );
    });

    it('offers the tooltip on static text too', () => {
      render(<EditableText value="Client-side tool" />);

      expect(screen.getByText('Client-side tool')).toHaveAttribute(
        'data-tooltip-trigger',
        'Client-side tool'
      );
    });

    it('falls back to the placeholder, which is what a value-less field renders', () => {
      render(<EditableText value="" placeholder="A very long placeholder" onChange={vi.fn()} />);

      expect(screen.getByRole('button')).toHaveAttribute(
        'data-tooltip-trigger',
        'A very long placeholder'
      );
    });

    it('drops the tooltip while editing, where the text is not truncated', async () => {
      const user = userEvent.setup();
      render(<EditableText value="A very long description" onChange={vi.fn()} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('textbox')).not.toHaveAttribute('data-tooltip-trigger');
    });
  });

  describe('multiline', () => {
    it('inserts a newline on Shift+Enter without committing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<EditableText value="First" multiline onChange={onChange} aria-label="Description" />);

      await user.click(screen.getByRole('button', { name: /^Description/ }));
      await user.keyboard('{End}{Shift>}{Enter}{/Shift}Second');

      expect(screen.getByRole('textbox', { name: /^Description/ })).toHaveValue('First\nSecond');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('commits the multi-line value on a plain Enter', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<EditableText value="First" multiline onChange={onChange} aria-label="Description" />);

      await user.click(screen.getByRole('button', { name: /^Description/ }));
      await user.keyboard('{End}{Shift>}{Enter}{/Shift}Second{Enter}');

      expect(onChange).toHaveBeenCalledExactlyOnceWith('First\nSecond');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('caps the editor at maxLines and leaves it scrollable', async () => {
      const user = userEvent.setup();
      render(
        <EditableText
          value="First"
          multiline
          maxLines={2}
          size="sm"
          onChange={vi.fn()}
          aria-label="Description"
        />
      );

      await user.click(screen.getByRole('button', { name: /^Description/ }));

      // 2 lines * 16px (`leading-4`) + 4px of `py-0.5`.
      expect(screen.getByRole('textbox', { name: /^Description/ })).toHaveStyle({
        maxHeight: '36px',
      });
    });

    it('keeps Enter single-line when multiline is off', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<EditableText value="First" onChange={onChange} aria-label="Node name" />);

      await user.click(screen.getByRole('button', { name: /^Node name/ }));
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders no error message when no error is passed', () => {
      render(<EditableText value="End" onChange={vi.fn()} aria-label="Node name" />);
      expect(document.querySelector('[data-slot="editable-text-error"]')).toBeNull();
    });

    it('shows the message and marks the trigger invalid while collapsed', () => {
      render(
        <EditableText
          value="1 bad"
          onChange={vi.fn()}
          aria-label="Node name"
          error="Tool name must begin with a letter."
        />
      );

      const trigger = screen.getByRole('button', { name: /^Node name/ });
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Tool name must begin with a letter.')).toBeInTheDocument();
      expect(trigger).toHaveAccessibleDescription('Tool name must begin with a letter.');
    });

    it('keeps the error visible after the editor closes, so a rejected commit still explains itself', async () => {
      const user = userEvent.setup();
      render(
        <EditableText
          value="1 bad"
          onChange={vi.fn()}
          aria-label="Node name"
          error="Tool name must begin with a letter."
        />
      );

      await user.click(screen.getByRole('button', { name: /^Node name/ }));
      const input = screen.getByRole('textbox', { name: 'Node name' });
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Tool name must begin with a letter.');

      await user.keyboard('{Escape}');

      expect(screen.getByRole('button', { name: /^Node name/ })).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      expect(screen.getByText('Tool name must begin with a letter.')).toBeInTheDocument();
    });

    it('describes static text without claiming an unsupported invalid state on a generic role', () => {
      render(<EditableText value="End" error="Something is off." />);

      const text = document.querySelector('[data-slot="editable-text"]')!;
      expect(text).not.toHaveAttribute('aria-invalid');
      expect(screen.getByText('Something is off.')).toBeInTheDocument();
      expect(text).toHaveAccessibleDescription('Something is off.');
    });

    it('still commits while in error, so the user can type their way out', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <EditableText
          value="1 bad"
          onChange={onChange}
          aria-label="Node name"
          error="Tool name must begin with a letter."
        />
      );

      await user.click(screen.getByRole('button', { name: /^Node name/ }));
      await user.keyboard('Analyze files{Enter}');

      expect(onChange).toHaveBeenCalledExactlyOnceWith('Analyze files');
    });
  });
});
