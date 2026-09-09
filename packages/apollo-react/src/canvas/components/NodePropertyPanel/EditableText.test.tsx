import { type HTMLAttributes, type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import type { EditableTextProps } from './EditableText';
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

/** Owns the text, as a real consumer must: the field only shows what comes back through `value`. */
function Controlled({
  initial,
  validate,
  onChangeSpy,
  ...props
}: {
  initial: string;
  validate?: (text: string) => string | undefined;
  onChangeSpy?: (next: string) => void;
} & Omit<EditableTextProps, 'value' | 'onChange'>) {
  const [text, setText] = useState(initial);

  return (
    <EditableText
      {...props}
      value={text}
      onChange={(next) => {
        onChangeSpy?.(next);
        setText(next);
      }}
      error={props.error ?? validate?.(text)}
    />
  );
}

describe('EditableText', () => {
  it('renders static text with no interactive affordance when the callbacks are omitted', () => {
    render(<EditableText value="End" />);
    expect(screen.getByText('End')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('stays static without onSubmit, since it would have nowhere to commit', () => {
    render(<EditableText value="End" onChange={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not enter edit mode when disabled', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="End" onSubmit={vi.fn()} aria-label="Node name" disabled />);

    const trigger = screen.getByRole('button', { name: /^Node name/ });
    await user.click(trigger);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // The trigger stays a focusable button (aria-disabled, not disabled), so a
    // truncated value keeps its overflow tooltip.
    expect(trigger).toHaveAttribute('data-tooltip-trigger', 'End');
    expect(trigger).not.toBeDisabled();
  });

  it('leaves edit mode without submitting when disabled mid-edit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <EditableText value="End" onChange={vi.fn()} onSubmit={onSubmit} aria-label="Node name" />
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    rerender(
      <EditableText
        value="Ending"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        aria-label="Node name"
        disabled
      />
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    // The text belongs to the owner, so it survives the editor closing.
    expect(screen.getByRole('button', { name: /^Node name/ })).toHaveTextContent('Ending');
  });

  it('shows the placeholder in place of an empty value', () => {
    render(<Controlled initial="" placeholder="Control" onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Control' })).toBeInTheDocument();
  });

  it('enters edit mode on a single click and selects the current value', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="End" onSubmit={vi.fn()} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));

    const input = screen.getByRole('textbox', { name: /^Node name/ });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('End');
    expect((input as HTMLInputElement).selectionStart).toBe(0);
    expect((input as HTMLInputElement).selectionEnd).toBe(3);
  });

  it('reports every keystroke through onChange', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(
      <Controlled initial="" onChangeSpy={onChangeSpy} onSubmit={vi.fn()} aria-label="Node name" />
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('End');

    expect(onChangeSpy.mock.calls.map(([next]) => next)).toEqual(['E', 'En', 'End']);
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('End');
  });

  it('submits the trimmed value on Enter and closes', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Controlled initial="End" onSubmit={onSubmit} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('  Wrap up  {Enter}');

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Wrap up');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // The trim reaches the owner too, so read mode shows what was submitted.
    expect(screen.getByRole('button', { name: /^Node name/ })).toHaveTextContent('Wrap up');
  });

  it('submits on blur', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <Controlled initial="End" onSubmit={onSubmit} aria-label="Node name" />
        <button type="button">elsewhere</button>
      </>
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up');
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Wrap up');
  });

  it('reverts to the text it opened with on Escape, without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Controlled initial="End" onSubmit={onSubmit} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('Wrap up{Escape}');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^Node name/ })).toHaveTextContent('End');
  });

  it('does not submit when the editor closes on the text it opened with', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <Controlled initial="End" onSubmit={onSubmit} aria-label="Node name" />
        <button type="button">elsewhere</button>
      </>
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an empty string when the value is cleared, so the caller can delete it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Controlled initial="End" onSubmit={onSubmit} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('{Backspace}{Enter}');

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('');
  });

  it('renders owner feedback about the text being typed', async () => {
    const user = userEvent.setup();
    render(
      <Controlled
        initial="End"
        validate={(text) => (/^\d/.test(text) ? 'Must begin with a letter' : undefined)}
        onSubmit={vi.fn()}
        aria-label="Node name"
      />
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.clear(screen.getByRole('textbox', { name: 'Node name' }));
    await user.keyboard('2fa');

    expect(screen.getByText('Must begin with a letter')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );

    await user.keyboard('{Escape}');

    // Escape reverts the text, so the owner's message goes with it.
    expect(screen.queryByText('Must begin with a letter')).not.toBeInTheDocument();
  });

  it('keeps keystrokes from reaching an ancestor while editing', async () => {
    const user = userEvent.setup();
    const onAncestorKeyDown = vi.fn();
    render(
      <div onKeyDown={onAncestorKeyDown}>
        <Controlled initial="End" onSubmit={vi.fn()} aria-label="Node name" />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('x{Escape}');

    expect(onAncestorKeyDown).not.toHaveBeenCalled();
  });

  it('follows an external value change, editing or not', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EditableText value="End" onChange={vi.fn()} onSubmit={vi.fn()} aria-label="Node name" />
    );
    rerender(
      <EditableText value="Finish" onChange={vi.fn()} onSubmit={vi.fn()} aria-label="Node name" />
    );
    expect(screen.getByRole('button', { name: /^Node name/ })).toHaveTextContent('Finish');

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    rerender(
      <EditableText value="Wrap up" onChange={vi.fn()} onSubmit={vi.fn()} aria-label="Node name" />
    );
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Wrap up');
  });

  it('announces the value through the trigger, not only the field name', () => {
    render(<Controlled initial="End" onSubmit={vi.fn()} aria-label="Node name" />);
    expect(screen.getByRole('button', { name: 'Node name: End' })).toBeInTheDocument();
  });

  describe('multiline', () => {
    it('inserts a newline on Shift+Enter, submits the multi-line value on a plain Enter', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Controlled initial="First" multiline onSubmit={onSubmit} aria-label="Description" />);

      await user.click(screen.getByRole('button', { name: /^Description/ }));
      await user.keyboard('{End}{Shift>}{Enter}{/Shift}Second');
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('First\nSecond');
      expect(onSubmit).not.toHaveBeenCalled();

      await user.keyboard('{Enter}');
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith('First\nSecond');
    });

    it('collapses newlines and submits on Enter in wrap mode', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <Controlled initial="First" multiline="wrap" onSubmit={onSubmit} aria-label="Description" />
      );

      await user.click(screen.getByRole('button', { name: /^Description/ }));
      await user.keyboard('{End} draft{Shift>}{Enter}{/Shift}');
      expect(onSubmit).toHaveBeenCalledWith('First draft');

      await user.click(screen.getByRole('button', { name: /^Description/ }));
      await user.keyboard('{End}');
      await user.paste('\nSecond');
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        'First draft Second'
      );
    });

    it.each([
      [true],
      ['wrap'] as const,
    ])('caps the read clamp and the editor height at maxLines (multiline=%s)', async (multiline) => {
      const user = userEvent.setup();
      render(
        <Controlled
          initial="First"
          multiline={multiline}
          maxLines={2}
          onSubmit={vi.fn()}
          aria-label="Description"
        />
      );

      const trigger = screen.getByRole('button', { name: /^Description/ });
      expect(trigger).toHaveStyle({ '--editable-text-lines': '2' });

      await user.click(trigger);
      // 2 lines at the `lg` line box (20px) plus the editor's vertical padding.
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveStyle({
        maxHeight: '44px',
      });
    });
  });
});
