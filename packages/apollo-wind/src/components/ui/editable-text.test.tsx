import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditableText, type EditableTextProps } from './editable-text';

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
    // aria-disabled, not disabled, so the trigger stays focusable and its text readable.
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
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
      <fieldset onKeyDown={onAncestorKeyDown}>
        <Controlled initial="End" onSubmit={vi.fn()} aria-label="Node name" />
      </fieldset>
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

  describe('controlled editing', () => {
    /** Holds `editing` the way an owner does, so the editor opens and closes through it. */
    function OwnedEditing({
      initialEditing,
      onEditingSpy,
      ...props
    }: { initialEditing: boolean; onEditingSpy?: (editing: boolean) => void } & Omit<
      EditableTextProps,
      'value' | 'onChange' | 'editing' | 'onEditingChange'
    > & { initial: string }) {
      const [editing, setEditing] = useState(initialEditing);
      return (
        <Controlled
          {...props}
          editing={editing}
          onEditingChange={(next) => {
            onEditingSpy?.(next);
            setEditing(next);
          }}
        />
      );
    }

    it('opens focused with the text selected when the owner says so', () => {
      render(
        <OwnedEditing initial="End" initialEditing onSubmit={vi.fn()} aria-label="Node name" />
      );
      const input = screen.getByRole('textbox', { name: 'Node name' });
      expect(input).toHaveFocus();
      expect((input as HTMLInputElement).selectionStart).toBe(0);
      expect((input as HTMLInputElement).selectionEnd).toBe(3);
    });

    it('asks the owner to open on click and to close on commit', async () => {
      const user = userEvent.setup();
      const onEditingSpy = vi.fn();
      const onSubmit = vi.fn();
      render(
        <OwnedEditing
          initial="End"
          initialEditing={false}
          onEditingSpy={onEditingSpy}
          onSubmit={onSubmit}
          aria-label="Node name"
        />
      );
      await user.click(screen.getByRole('button', { name: /^Node name/ }));
      expect(onEditingSpy).toHaveBeenLastCalledWith(true);
      await user.keyboard('Finish{Enter}');
      expect(onEditingSpy).toHaveBeenLastCalledWith(false);
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Finish');
    });

    it('stays closed when the owner ignores the request', async () => {
      const user = userEvent.setup();
      const onEditingChange = vi.fn();
      render(
        <EditableText
          value="End"
          editing={false}
          onEditingChange={onEditingChange}
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          aria-label="Node name"
        />
      );
      await user.click(screen.getByRole('button', { name: /^Node name/ }));
      expect(onEditingChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('reverts on Escape to the text shown when the owner opened it', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <OwnedEditing initial="End" initialEditing onSubmit={onSubmit} aria-label="Node name" />
      );
      await user.keyboard('Finish{Escape}');
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Node name: End' })).toBeInTheDocument();
    });

    it('reverts to the text shown when the owner opens it later, not at mount', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const props = { onChange, onSubmit: vi.fn(), 'aria-label': 'Node name' };
      const { rerender } = render(<EditableText {...props} value="End" editing={false} />);
      rerender(<EditableText {...props} value="Finish" editing />);
      await user.keyboard('{Escape}');
      // Nothing was typed, so the text it opened with is what is shown: no revert to report.
      expect(onChange).not.toHaveBeenCalled();
      rerender(<EditableText {...props} value="Finish draft" editing />);
      await user.keyboard('{Escape}');
      expect(onChange).toHaveBeenLastCalledWith('Finish');
    });

    it('asks to close when disabled mid-edit, so it does not reopen when re-enabled', () => {
      const onEditingChange = vi.fn();
      const props = {
        value: 'End',
        editing: true,
        onEditingChange,
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        'aria-label': 'Node name',
      };
      const { rerender } = render(<EditableText {...props} />);
      rerender(<EditableText {...props} disabled />);
      expect(onEditingChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('never opens static text', () => {
      render(<EditableText value="End" editing />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  // A trailing negative margin would let whatever follows the editor, such as a required asterisk,
  // sit over its filled box.
  it('hangs the editor out on the leading side only', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="Invoice" onSubmit={vi.fn()} aria-label="Field label" />);
    expect(screen.getByRole('button', { name: /^Field label/ })).toHaveClass('-mx-1.5');
    await user.click(screen.getByRole('button', { name: /^Field label/ }));
    const input = screen.getByRole('textbox', { name: 'Field label' });
    expect(input).toHaveClass('-ml-1.5');
    expect(input).not.toHaveClass('-mx-1.5');
  });

  it('sets a field label in the label size', () => {
    render(
      <Controlled initial="Invoice" size="label" onSubmit={vi.fn()} aria-label="Field label" />
    );
    expect(screen.getByRole('button', { name: /^Field label/ })).toHaveClass(
      'text-xs',
      'font-medium',
      'text-foreground'
    );
  });

  it('has no accessibility violations in read and edit mode', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Controlled initial="End" onSubmit={vi.fn()} aria-label="Node name" error="Too short" />
    );
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('truncation tooltip', () => {
    // jsdom lays nothing out, so the trigger is cut off only when these say so.
    const cutOff = (cut: boolean) => {
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(cut ? 200 : 100);
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    };
    afterEach(() => vi.restoreAllMocks());

    it('shows the full text on hover while it is cut off', async () => {
      cutOff(true);
      const user = userEvent.setup();
      render(<Controlled initial="Enrich customer record" onSubmit={vi.fn()} aria-label="Name" />);
      await user.hover(screen.getByRole('button', { name: /^Name/ }));
      expect(await screen.findByRole('tooltip', {}, { timeout: 2000 })).toHaveTextContent(
        'Enrich customer record'
      );
    });

    it('shows nothing while the text fits', async () => {
      cutOff(false);
      const user = userEvent.setup();
      render(<Controlled initial="End" onSubmit={vi.fn()} aria-label="Name" />);
      await user.hover(screen.getByRole('button', { name: /^Name/ }));
      await new Promise((resolve) => setTimeout(resolve, 900));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('covers static text too', async () => {
      cutOff(true);
      const user = userEvent.setup();
      render(<EditableText value="Read-only label" />);
      await user.hover(screen.getByText('Read-only label'));
      expect(await screen.findByRole('tooltip', {}, { timeout: 2000 })).toHaveTextContent(
        'Read-only label'
      );
    });

    it('can be turned off', async () => {
      cutOff(true);
      const user = userEvent.setup();
      render(
        <Controlled
          initial="Enrich customer record"
          truncationTooltip={false}
          onSubmit={vi.fn()}
          aria-label="Name"
        />
      );
      await user.hover(screen.getByRole('button', { name: /^Name/ }));
      await new Promise((resolve) => setTimeout(resolve, 900));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
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
