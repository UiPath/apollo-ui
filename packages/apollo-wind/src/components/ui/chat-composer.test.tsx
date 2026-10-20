import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  ChatComposer,
  ChatComposerAttachButton,
  type ChatComposerAttachButtonProps,
  type ChatComposerAttachmentItem,
  ChatComposerAttachments,
  ChatComposerError,
  ChatComposerFooter,
  ChatComposerInputGroup,
  type ChatComposerProps,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
} from './chat-composer';

function TestComposer({
  onFiles,
  ...props
}: ChatComposerProps & { onFiles?: ChatComposerAttachButtonProps['onFiles'] }) {
  return (
    <ChatComposer {...props}>
      <ChatComposerInputGroup>
        <ChatComposerAttachments />
        <ChatComposerTextarea />
        <ChatComposerToolbar>
          <ChatComposerAttachButton onFiles={onFiles} />
          <ChatComposerSubmit />
        </ChatComposerToolbar>
      </ChatComposerInputGroup>
      <ChatComposerFooter>Autopilot can make mistakes.</ChatComposerFooter>
    </ChatComposer>
  );
}

const textbox = () => screen.getByRole('textbox', { name: 'Message' });

describe('ChatComposer', () => {
  it('submits on Enter and clears the draft', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestComposer onSubmit={onSubmit} />);

    await user.type(textbox(), 'Summarize the batch{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('Summarize the batch', { attachments: [] });
    expect(textbox()).toHaveValue('');
  });

  it('submits from the send button', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestComposer onSubmit={onSubmit} />);

    await user.type(textbox(), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(onSubmit).toHaveBeenCalledWith('Hello', { attachments: [] });
  });

  it('inserts a newline on Shift+Enter without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestComposer onSubmit={onSubmit} />);

    await user.type(textbox(), 'first{Shift>}{Enter}{/Shift}second');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(textbox()).toHaveValue('first\nsecond');
  });

  it('ignores Enter while an IME composition is active', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestComposer onSubmit={onSubmit} />);

    await user.type(textbox(), 'konnichiwa');
    fireEvent.keyDown(textbox(), { key: 'Enter', isComposing: true });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(textbox()).toHaveValue('konnichiwa');
  });

  it('disables send while the draft is empty or whitespace', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestComposer onSubmit={onSubmit} />);
    const send = screen.getByRole('button', { name: 'Send message' });

    expect(send).toBeDisabled();
    await user.type(textbox(), '   {Enter}');
    expect(send).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('enables send with attachments and no text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const attachments = [{ id: 'a', name: 'report.pdf' }];
    render(<TestComposer onSubmit={onSubmit} attachments={attachments} />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(onSubmit).toHaveBeenCalledWith('', { attachments });
  });

  it('holds back sending while an attachment is uploading or processing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TestComposer
        onSubmit={onSubmit}
        attachments={[{ id: 'a', name: 'report.pdf', state: 'uploading' }]}
      />
    );
    const send = screen.getByRole('button', { name: 'Send message' });

    await user.type(textbox(), 'Hi{Enter}');
    expect(send).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <TestComposer
        onSubmit={onSubmit}
        attachments={[{ id: 'a', name: 'report.pdf', state: 'processing' }]}
      />
    );
    expect(send).toBeDisabled();

    rerender(
      <TestComposer
        onSubmit={onSubmit}
        attachments={[{ id: 'a', name: 'report.pdf', state: 'error' }]}
      />
    );
    expect(send).toBeEnabled();
  });

  it('holds back sending under submitDisabled but keeps the textarea editable', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestComposer submitDisabled onSubmit={onSubmit} />);

    await user.type(textbox(), 'Hi{Enter}');

    expect(textbox()).toBeEnabled();
    expect(textbox()).toHaveValue('Hi');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('works controlled, leaving the clearing to the consumer', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    function Controlled() {
      const [value, setValue] = React.useState('draft');
      return (
        <TestComposer value={value} onValueChange={setValue} onSubmit={(next) => onSubmit(next)} />
      );
    }
    render(<Controlled />);

    await user.type(textbox(), '!{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('draft!');
    expect(textbox()).toHaveValue('draft!');
  });

  it('seeds an uncontrolled draft from defaultValue', () => {
    render(<TestComposer defaultValue="Hi there" />);
    expect(textbox()).toHaveValue('Hi there');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
  });

  it('reports edits and the clear after sending through onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TestComposer onValueChange={onValueChange} />);

    await user.type(textbox(), 'Hi{Enter}');

    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(['H', 'Hi', '']);
  });

  it('shows a stop button while streaming that fires onStop, and holds back Enter', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    render(<TestComposer status="streaming" onStop={onStop} onSubmit={onSubmit} />);

    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
    await user.type(textbox(), 'next{Enter}');
    await user.click(screen.getByRole('button', { name: 'Stop generating' }));

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps a disabled send button while streaming without onStop', () => {
    render(<TestComposer status="streaming" />);

    expect(screen.queryByRole('button', { name: 'Stop generating' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('forwards picked files from the attach button', async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    const { container } = render(<TestComposer onFiles={onFiles} />);
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    await user.click(screen.getByRole('button', { name: 'Attach files' }));
    const input = container.querySelector<HTMLInputElement>('input[type=file]');
    if (!input) throw new Error('missing file input');
    await user.upload(input, file);

    expect(onFiles).toHaveBeenCalledWith([file], []);
  });

  it('checks picked files and counts the attached ones against maxFiles', async () => {
    // Without applyAccept, upload acts like a user who switched the picker to all files.
    const user = userEvent.setup({ applyAccept: false });
    const onFiles = vi.fn();
    const { container } = render(
      <ChatComposer attachments={[{ id: 'a', name: 'attached.pdf' }]}>
        <ChatComposerInputGroup>
          <ChatComposerTextarea />
          <ChatComposerToolbar>
            <ChatComposerAttachButton
              accept={['.pdf', 'image/*']}
              maxSize={10}
              maxFiles={2}
              onFiles={onFiles}
            />
          </ChatComposerToolbar>
        </ChatComposerInputGroup>
      </ChatComposer>
    );
    const exe = new File(['x'], 'tool.exe', { type: 'application/octet-stream' });
    const big = new File(['x'.repeat(20)], 'big.pdf', { type: 'application/pdf' });
    const first = new File(['x'], 'one.png', { type: 'image/png' });
    const second = new File(['x'], 'two.png', { type: 'image/png' });

    await user.click(screen.getByRole('button', { name: 'Attach files' }));
    const input = container.querySelector<HTMLInputElement>('input[type=file]');
    if (!input) throw new Error('missing file input');
    expect(input).toHaveAttribute('accept', '.pdf,image/*');
    await user.upload(input, [exe, big, first, second]);

    expect(onFiles).toHaveBeenCalledWith(
      [first],
      [
        { file: exe, reason: 'type' },
        { file: big, reason: 'size' },
        { file: second, reason: 'count' },
      ]
    );
  });

  it('renders attachment chips with their state and a remove action', async () => {
    const user = userEvent.setup();
    const onRemoveAttachment = vi.fn();
    const attachments: ChatComposerAttachmentItem[] = [
      { id: '1', name: 'brief.pdf', state: 'uploading', description: 'Uploading' },
      { id: '2', name: 'data.csv', state: 'error', description: 'Upload failed' },
    ];
    render(<TestComposer attachments={attachments} onRemoveAttachment={onRemoveAttachment} />);

    expect(screen.getByText('brief.pdf').closest('[data-slot=attachment]')).toHaveAttribute(
      'data-state',
      'uploading'
    );
    expect(screen.getByText('data.csv').closest('[data-slot=attachment]')).toHaveAttribute(
      'data-state',
      'error'
    );
    await user.click(screen.getByRole('button', { name: 'Remove data.csv' }));

    expect(onRemoveAttachment).toHaveBeenCalledWith(attachments[1]);
  });

  it('renders the error bar as an alert that can be dismissed', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <ChatComposer>
        <ChatComposerError variant="warning" onDismiss={onDismiss}>
          Rate limit reached
        </ChatComposerError>
      </ChatComposer>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Rate limit reached');
    expect(alert).toHaveAttribute('data-variant', 'warning');
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('starts at one row when compact and two when comfortable', () => {
    const { unmount } = render(<TestComposer density="compact" />);
    expect(textbox()).toHaveAttribute('rows', '1');
    unmount();
    render(<TestComposer />);
    expect(textbox()).toHaveAttribute('rows', '2');
  });

  it('disables the whole composer', () => {
    render(<TestComposer disabled defaultValue="Hi" />);
    expect(textbox()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Attach files' })).toBeDisabled();
  });

  it('rings the whole box rather than the row, in error when invalid', () => {
    const { container, rerender } = render(
      <ChatComposer>
        <ChatComposerInputGroup>
          <ChatComposerTextarea />
        </ChatComposerInputGroup>
      </ChatComposer>
    );
    const focusRing = (slot: string) =>
      container
        .querySelector(`[data-slot=${slot}]`)
        ?.className.split(' ')
        .filter((name) =>
          name.startsWith('has-[[data-slot=input-group-control]:focus-visible]:ring-')
        );
    expect(focusRing('input-group')).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/:ring-2$/),
        expect.stringMatching(/:ring-ring$/),
      ])
    );
    expect(focusRing('input-group-row')).toContain(
      'has-[[data-slot=input-group-control]:focus-visible]:ring-0'
    );
    expect(focusRing('input-group-row')).not.toContain(
      'has-[[data-slot=input-group-control]:focus-visible]:ring-2'
    );

    rerender(
      <ChatComposer>
        <ChatComposerInputGroup invalid>
          <ChatComposerTextarea />
        </ChatComposerInputGroup>
      </ChatComposer>
    );
    expect(focusRing('input-group')).toContain(
      'has-[[data-slot=input-group-control]:focus-visible]:ring-error'
    );
    expect(focusRing('input-group')).not.toContain(
      'has-[[data-slot=input-group-control]:focus-visible]:ring-ring'
    );
  });

  it('takes overridden strings', () => {
    render(
      <TestComposer
        strings={{
          label: 'Nachricht',
          placeholder: 'Frag etwas',
          send: 'Senden',
          attach: 'Anhängen',
        }}
      />
    );
    const field = screen.getByRole('textbox', { name: 'Nachricht' });
    expect(field).toHaveAttribute('placeholder', 'Frag etwas');
    expect(screen.getByRole('button', { name: 'Senden' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anhängen' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <TestComposer
        attachments={[{ id: '1', name: 'brief.pdf', state: 'uploading' }]}
        onRemoveAttachment={() => {}}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
