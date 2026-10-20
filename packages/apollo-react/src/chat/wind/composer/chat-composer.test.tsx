import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  ApChat,
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  type AutopilotChatRenderer,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const createService = (
  config: Partial<AutopilotChatConfiguration> = {},
  renderer: AutopilotChatRenderer = 'wind'
) =>
  AutopilotChatService.Instantiate({
    instanceName: `wind-composer-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.FullScreen, renderer, ...config },
  });

function setup(config: Partial<AutopilotChatConfiguration> = {}) {
  const service = createService(config);
  const requests: AutopilotChatMessage[] = [];
  service.intercept(AutopilotChatInterceptableEvent.Request, (message: AutopilotChatMessage) => {
    requests.push(message);
  });
  render(<ApChat chatServiceInstance={service} />);
  return { service, requests };
}

const textbox = () => screen.getByRole('textbox', { name: 'Message' });
// The attach button opens the composer's file input; the pick then goes through its checks.
async function pick(...files: File[]) {
  await userEvent.click(screen.getByRole('button', { name: 'Attach file(s)' }));
  const input = document.querySelector(
    '[data-slot="chat-composer-file-input"]'
  ) as HTMLInputElement;
  await userEvent.upload(input, files);
}

const file = (name: string, type: string, size = 10) =>
  new File(['x'.repeat(size)], name, { type, lastModified: 1 });

describe('Wind composer', () => {
  it('sends with Enter, keeps Shift+Enter for a new line, and clears the draft', async () => {
    const { requests } = setup();

    await userEvent.type(textbox(), 'Hello{Shift>}{Enter}{/Shift}there');
    expect(textbox()).toHaveValue('Hello\nthere');
    expect(requests).toHaveLength(0);

    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]).toMatchObject({ content: 'Hello\nthere', attachments: [] });
    expect(textbox()).toHaveValue('');
  });

  it('switches the button from send to stop in one step, without a style change', async () => {
    setup();
    await userEvent.type(textbox(), 'Hi');
    const button = () =>
      document.querySelector('[data-slot="chat-composer-submit"]') as HTMLButtonElement;
    const classes = button().className;
    const statuses: Array<string | null> = [];
    const observer = new MutationObserver(() => {
      const status = button().getAttribute('data-status');
      if (statuses.at(-1) !== status) statuses.push(status);
    });
    observer.observe(document.body, { subtree: true, attributes: true, childList: true });

    await userEvent.keyboard('{Enter}');
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    observer.disconnect();

    expect(statuses).toEqual(['streaming']);
    expect(button()).toHaveAccessibleName('Stop');
    expect(button().className).toBe(classes);
  });

  it('lets an uploading file be removed, and does not bring it back when the upload ends', async () => {
    const { service } = setup();
    const removed: unknown[] = [];
    service.on('setAttachments', ({ removed: files }: { removed: unknown[] }) =>
      removed.push(...files)
    );
    await pick(file('slow.txt', 'text/plain'));
    act(() =>
      service.setAttachmentsLoading([
        { name: 'slow.txt', size: 10, loading: true } as Parameters<
          typeof service.setAttachmentsLoading
        >[0][number],
      ])
    );
    expect(document.querySelector('[data-slot="attachment"]')).toHaveAttribute(
      'data-state',
      'uploading'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove slow.txt' }));
    act(() => service.setAttachmentsLoading([]));

    expect(removed).toHaveLength(1);
    expect(document.querySelector('[data-slot="chat-composer-attachments"]')).toBeNull();
  });

  it('does not send with Enter while a reply is in flight and stop is disabled', async () => {
    const { service, requests } = setup({ disabledFeatures: { stopResponse: true } });
    act(() => service.setWaiting(true));

    await userEvent.type(textbox(), 'Too soon{Enter}');

    expect(requests).toHaveLength(0);
    expect(textbox()).toHaveValue('Too soon');
  });

  it('returns focus to the field after sending with the button', async () => {
    const { requests } = setup();
    await userEvent.type(textbox(), 'Hi');

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(textbox()).toHaveFocus();
  });

  it('follows the service prompt', () => {
    const { service } = setup();

    act(() => service.setPrompt('From the host'));

    expect(textbox()).toHaveValue('From the host');
  });

  it('turns send into stop while a reply is awaited, unless stopResponse is disabled', async () => {
    const { service } = setup();
    let stopped = 0;
    service.on('stopResponse', () => {
      stopped += 1;
    });
    await userEvent.type(textbox(), 'Hi{Enter}');

    await userEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(stopped).toBe(1);

    act(() => service.setDisabledFeatures({ stopResponse: true }));
    await userEvent.type(textbox(), 'Again{Enter}');
    expect(await screen.findByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('shows the service error as an alert, as markdown, and dismisses it', async () => {
    const { service } = setup();

    act(() => service.setError('Something went **wrong**.'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-variant', 'error');
    expect(within(alert).getByText('wrong').tagName).toBe('STRONG');

    act(() => service.setError('Careful.', 'warn'));
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'warning');

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(service.getError()).toBeUndefined();
    // Focus stays in the composer rather than dropping to the page.
    expect(textbox()).toHaveFocus();
  });

  it('attaches picked files and sends them with the prompt', async () => {
    const { requests } = setup();

    await pick(file('notes.txt', 'text/plain'));

    expect(await screen.findByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove notes.txt' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.attachments?.map(({ name }) => name)).toEqual(['notes.txt']);
    expect(document.querySelector('[data-slot="chat-composer-attachments"]')).toBeNull();
  });

  it('names files that are too large, as Material does', async () => {
    setup({
      allowedAttachments: { multiple: true, types: { 'text/plain': ['.txt'] }, maxSize: 5 },
    });

    await pick(file('big.txt', 'text/plain', 20));

    expect(await screen.findByRole('alert')).toHaveTextContent('big.txt');
    expect(screen.queryByRole('button', { name: /Remove big\.txt/ })).toBeNull();
  });

  it('takes files dropped or pasted anywhere on the panel', async () => {
    setup();
    const panel = document.querySelector('[data-slot="wind-chat-dropzone"]') as HTMLElement;

    fireEvent.drop(panel, {
      dataTransfer: { types: ['Files'], files: [file('dropped.txt', 'text/plain')], items: [] },
    });
    expect(await screen.findByText('dropped.txt')).toBeInTheDocument();

    fireEvent.paste(panel, {
      clipboardData: { types: ['Files'], files: [file('pasted.txt', 'text/plain')], items: [] },
    });
    expect(await screen.findByText('pasted.txt')).toBeInTheDocument();
  });

  it('hides the attach button and ignores drops when attachments are disabled', async () => {
    setup({ disabledFeatures: { attachments: true } });

    expect(screen.queryByRole('button', { name: 'Attach file(s)' })).toBeNull();
    const panel = document.querySelector('[data-slot="wind-chat-dropzone"]') as HTMLElement;
    fireEvent.drop(panel, {
      dataTransfer: { types: ['Files'], files: [file('dropped.txt', 'text/plain')], items: [] },
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(screen.queryByText('dropped.txt')).toBeNull();
  });

  it('is compact with spacing.compactMode and shows the footer disclaimer at 10px', () => {
    setup({ spacing: { compactMode: true } });

    expect(document.querySelector('[data-slot="chat-composer"]')).toHaveAttribute(
      'data-density',
      'compact'
    );
    expect(document.querySelector('[data-slot="chat-composer-footer"]')).toHaveClass('text-[10px]');
  });

  it("keeps a sent message's attachment row inside the message so it scrolls", async () => {
    const { requests } = setup();
    await pick(file('one.txt', 'text/plain'), file('two.txt', 'text/plain'));
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(requests).toHaveLength(1));

    const row = document.querySelector(
      '[data-chat-message-id] [data-slot="wind-chat-message-attachments"]'
    ) as HTMLElement;
    // An end-aligned part sizes to its content; the cap keeps the row within the message.
    expect(row.parentElement).toHaveClass('max-w-full');
    expect(row.querySelector('[data-slot="attachment"]')).toHaveClass('max-w-[calc(50cqw-4px)]');
  });

  it('spaces draft chips like sent ones', async () => {
    setup();
    await pick(file('one.txt', 'text/plain'), file('two.txt', 'text/plain'));
    await screen.findByText('two.txt');

    const draft = document.querySelector('[data-slot="chat-composer-attachments"]');
    expect(draft).toHaveClass('gap-2');
    expect(draft).not.toHaveClass('gap-3');
  });
});

describe('Wind composer attachment intake', () => {
  const panel = () => document.querySelector('[data-slot="wind-chat-dropzone"]') as HTMLElement;
  const chips = () =>
    [
      ...document.querySelectorAll(
        '[data-slot="chat-composer-attachments"] [data-slot="attachment"]'
      ),
    ].map((chip) => chip.textContent);
  const dropFiles = (...files: File[]) =>
    fireEvent.drop(panel(), { dataTransfer: { types: ['Files'], files, items: [] } });
  const pasteFiles = (text: string, ...files: File[]) =>
    fireEvent.paste(panel(), {
      clipboardData: { types: ['text/plain', 'Files'], files, items: [], getData: () => text },
    });

  it('catches a file dropped on the panel while it cannot take it', () => {
    setup({ disabledFeatures: { attachments: true } });

    // fireEvent returns false when the default (opening the file in the tab) was prevented.
    expect(dropFiles(file('a.txt', 'text/plain'))).toBe(false);
    expect(
      fireEvent.dragOver(panel(), { dataTransfer: { types: ['Files'], files: [], items: [] } })
    ).toBe(false);
  });

  it('keeps the text of a paste whose file is refused, and names the file', async () => {
    setup({
      allowedAttachments: { multiple: true, types: { 'text/plain': ['.txt'] }, maxSize: 1024 },
    });

    expect(pasteFiles('some text', file('tool.exe', 'application/x-msdownload'))).toBe(true);

    expect(await screen.findByRole('alert')).toHaveTextContent('tool.exe');
    expect(chips()).toEqual([]);
  });

  it('takes a pasted file that passes, instead of the text', async () => {
    setup({
      allowedAttachments: { multiple: true, types: { 'text/plain': ['.txt'] }, maxSize: 1024 },
    });

    expect(pasteFiles('some text', file('notes.txt', 'text/plain'))).toBe(false);

    await waitFor(() => expect(chips()).toEqual(['notes.txt']));
  });

  it('counts files from every source against maxCount', async () => {
    setup({
      allowedAttachments: {
        multiple: true,
        types: { 'text/plain': ['.txt'] },
        maxSize: 1024,
        maxCount: 3,
      },
    });
    await pick(file('a.txt', 'text/plain'), file('b.txt', 'text/plain'));
    await waitFor(() => expect(chips()).toEqual(['a.txt', 'b.txt']));

    dropFiles(file('c.txt', 'text/plain'), file('d.txt', 'text/plain'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(chips()).toEqual(['a.txt', 'b.txt']);
  });

  it('leaves out a file already attached when the draft is full, without an error', async () => {
    setup({
      allowedAttachments: {
        multiple: true,
        types: { 'text/plain': ['.txt'] },
        maxSize: 1024,
        maxCount: 2,
      },
    });
    await pick(file('a.txt', 'text/plain'), file('b.txt', 'text/plain'));
    await waitFor(() => expect(chips()).toEqual(['a.txt', 'b.txt']));

    dropFiles(file('a.txt', 'text/plain'));
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(screen.queryByRole('alert')).toBeNull();

    // A duplicate does not take the last free slot from a new file either.
    act(() => screen.getByRole('button', { name: 'Remove b.txt' }).click());
    dropFiles(file('a.txt', 'text/plain'), file('c.txt', 'text/plain'));
    await waitFor(() => expect(chips()).toEqual(['a.txt', 'c.txt']));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reads maxCount 0 as no limit, as Material does', async () => {
    setup({
      allowedAttachments: {
        multiple: true,
        types: { 'text/plain': ['.txt'] },
        maxSize: 1024,
        maxCount: 0,
      },
    });

    await pick(file('a.txt', 'text/plain'), file('b.txt', 'text/plain'));
    dropFiles(file('c.txt', 'text/plain'));

    await waitFor(() => expect(chips()).toEqual(['a.txt', 'b.txt', 'c.txt']));
  });
});

describe('composer parity', () => {
  async function sendFrom(renderer: AutopilotChatRenderer) {
    const service = createService({}, renderer);
    const requests: AutopilotChatMessage[] = [];
    service.intercept(AutopilotChatInterceptableEvent.Request, (message: AutopilotChatMessage) => {
      requests.push(message);
    });
    const { unmount } = render(<ApChat chatServiceInstance={service} />);
    act(() => service.setPrompt('Same prompt'));

    await userEvent.click(await screen.findByRole('button', { name: 'Send' }, { timeout: 25_000 }));
    await waitFor(() => expect(requests).toHaveLength(1));
    unmount();
    const { id: _id, created_at: _created, ...payload } = requests[0] as AutopilotChatMessage;
    return payload;
  }

  it('sends the same Request payload from Wind and Material', async () => {
    const material = await sendFrom('material');
    const wind = await sendFrom('wind');

    expect(wind).toEqual(material);
  }, 40_000);

  // Each renderer's panel-wide drop target: Wind's overlay, Material's react-dropzone root.
  const dropTarget = (renderer: AutopilotChatRenderer) =>
    (renderer === 'wind'
      ? document.querySelector('[data-slot="wind-chat-dropzone"]')
      : document.querySelector('input[type="file"][style*="display: none"]')
          ?.parentElement) as HTMLElement;
  const transfer = (...files: File[]) => ({
    types: ['Files'],
    files,
    items: files.map((item) => ({
      kind: 'file',
      type: item.type,
      getAsFile: () => item,
      getAsString: () => undefined,
    })),
  });

  async function dropTwice(renderer: AutopilotChatRenderer) {
    const service = createService({}, renderer);
    const added: string[] = [];
    service.on(
      AutopilotChatEvent.SetAttachments,
      ({ added: files }: { added: { name: string }[] }) =>
        added.push(...files.map(({ name }) => name))
    );
    const { unmount } = render(<ApChat chatServiceInstance={service} />);
    await screen.findByRole('button', { name: /Attach file/ }, { timeout: 25_000 });
    const drop = (...files: File[]) =>
      fireEvent.drop(dropTarget(renderer), { dataTransfer: transfer(...files) });

    drop(new File(['abc'], 'notes.txt', { type: 'text/plain', lastModified: 1 }));
    await waitFor(() => expect(added).toEqual(['notes.txt']));
    // Same name and size: the same file, whatever its date. A new size is a new file.
    drop(new File(['xyz'], 'notes.txt', { type: 'text/plain', lastModified: 2 }));
    drop(new File(['abcd'], 'notes.txt', { type: 'text/plain', lastModified: 1 }));
    await waitFor(() => expect(added).toEqual(['notes.txt', 'notes.txt']));
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    const result = { added, alert: screen.queryByRole('alert')?.textContent ?? null };
    unmount();
    return result;
  }

  it('leaves out a file already attached in Wind and Material alike', async () => {
    const material = await dropTwice('material');
    const wind = await dropTwice('wind');

    expect(material).toEqual({ added: ['notes.txt', 'notes.txt'], alert: null });
    expect(wind).toEqual(material);
  }, 40_000);

  // Wind takes pastes on the panel, Material on its input.
  const pasteTarget = (renderer: AutopilotChatRenderer) =>
    (renderer === 'wind'
      ? document.querySelector('[data-slot="wind-chat-dropzone"]')
      : document.querySelector('[contenteditable="true"]')) as HTMLElement;

  async function pasteBackToBack(renderer: AutopilotChatRenderer) {
    const service = createService({}, renderer);
    const added: string[] = [];
    service.on(
      AutopilotChatEvent.SetAttachments,
      ({ added: files }: { added: { name: string }[] }) =>
        added.push(...files.map(({ name }) => name))
    );
    const { unmount } = render(<ApChat chatServiceInstance={service} />);
    await screen.findByRole('button', { name: /Attach file/ }, { timeout: 25_000 });
    const paste = (item: File) =>
      fireEvent.paste(pasteTarget(renderer), { clipboardData: transfer(item) });

    // Both intakes finish before the chat renders again.
    paste(new File(['a'], 'first.txt', { type: 'text/plain' }));
    paste(new File(['b'], 'second.txt', { type: 'text/plain' }));
    await waitFor(() => expect(added).toHaveLength(2));
    unmount();
    return added.sort();
  }

  it('keeps both of two pastes that land before a re-render, in Wind and Material', async () => {
    const material = await pasteBackToBack('material');
    const wind = await pasteBackToBack('wind');

    expect(material).toEqual(['first.txt', 'second.txt']);
    expect(wind).toEqual(material);
  }, 40_000);
});
