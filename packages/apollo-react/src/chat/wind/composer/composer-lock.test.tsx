import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;

function setup(config: Partial<AutopilotChatConfiguration> = {}) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-composer-lock-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      renderer: 'wind',
      composerLocked: true,
      ...config,
    },
  });
  const requests: AutopilotChatMessage[] = [];
  service.intercept(AutopilotChatInterceptableEvent.Request, (message: AutopilotChatMessage) => {
    requests.push(message);
  });
  render(<ApChat chatServiceInstance={service} />);
  return { service, requests };
}

const textbox = () => screen.getByRole('textbox', { name: 'Message' });
const submit = () =>
  document.querySelector('[data-slot="chat-composer-submit"]') as HTMLButtonElement;
const composer = () => document.querySelector('[data-slot="chat-composer"]') as HTMLFormElement;
const panel = () => document.querySelector('[data-slot="wind-chat-dropzone"]') as HTMLElement;
const chips = () =>
  [...document.querySelectorAll('[data-slot="chat-composer-attachments"] [data-slot="attachment"]')]
    .map((chip) => chip.textContent)
    .filter(Boolean);
const file = (name: string) => new File(['x'], name, { type: 'text/plain', lastModified: 1 });
const pause = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));
const reply = { content: 'Twelve invoices.', widget: 'apollo-markdown-renderer', created_at: '' };

describe('Wind composer lock', () => {
  it('shows a disabled field with the placeholder override', () => {
    setup({ overrideLabels: { inputPlaceholder: 'Fill in the form to start' } });

    expect(textbox()).toBeDisabled();
    expect(textbox()).toHaveAttribute('placeholder', 'Fill in the form to start');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not send by button, Enter or form submit, and keeps the draft', async () => {
    const { service, requests } = setup();
    act(() => service.setPrompt('Draft from before'));

    expect(submit()).toBeDisabled();
    await userEvent.click(submit());
    fireEvent.keyDown(textbox(), { key: 'Enter' });
    fireEvent.submit(composer());
    await pause();

    expect(requests).toHaveLength(0);
    expect(textbox()).toHaveValue('Draft from before');
  });

  it('does not take typed or pasted text', async () => {
    setup();

    await userEvent.type(textbox(), 'Hello');
    await userEvent.click(textbox());
    await userEvent.paste('Pasted');

    expect(textbox()).toHaveValue('');
  });

  it('does not take files from the attach button, a drop or a paste', async () => {
    setup();

    // The catalog loads after the first render and changes the label.
    expect(screen.getByRole('button', { name: /Attach file/ })).toBeDisabled();
    // The drop is still caught, so the browser does not open the file in the tab.
    expect(
      fireEvent.drop(panel(), {
        dataTransfer: { types: ['Files'], files: [file('dropped.txt')], items: [] },
      })
    ).toBe(false);
    fireEvent.paste(panel(), {
      clipboardData: { types: ['Files'], files: [file('pasted.txt')], items: [] },
    });
    await pause();

    expect(chips()).toEqual([]);
  });

  it('disables the suggestions under a reply', async () => {
    const { service, requests } = setup({ composerLocked: false });
    act(() => service.sendResponse(reply));
    act(() => service.setSuggestions([{ label: 'Overdue', prompt: 'Which are overdue?' }], true));
    const suggestion = () =>
      within(screen.getByRole('group', { name: 'Suggestions' })).getByRole('button', {
        name: 'Overdue',
      });

    act(() => service.setComposerLocked(true));
    expect(suggestion()).toBeDisabled();
    await userEvent.click(suggestion());
    await pause();
    expect(requests).toHaveLength(0);
    expect(textbox()).toHaveValue('');

    act(() => service.setComposerLocked(false));
    await userEvent.click(suggestion());
    await waitFor(() => expect(requests).toHaveLength(1));
  });

  it('restores the composer with its draft and attachments when unlocked', async () => {
    const { service, requests } = setup({ composerLocked: false });
    await userEvent.type(textbox(), 'Which invoices came in?');
    fireEvent.drop(panel(), {
      dataTransfer: { types: ['Files'], files: [file('report.txt')], items: [] },
    });
    expect(await screen.findByText('report.txt')).toBeInTheDocument();

    act(() => service.setComposerLocked(true));
    expect(textbox()).toBeDisabled();
    expect(textbox()).toHaveValue('Which invoices came in?');
    expect(screen.queryByRole('button', { name: /Remove report\.txt/ })).toBeNull();

    act(() => service.setComposerLocked(false));
    expect(textbox()).toBeEnabled();
    expect(textbox()).toHaveValue('Which invoices came in?');
    expect(chips()).toHaveLength(1);

    await userEvent.click(submit());
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]).toMatchObject({ content: 'Which invoices came in?' });
    expect(requests[0]?.attachments).toHaveLength(1);
  });

  it('locks when the host locks from its welcome content as the chat mounts', () => {
    const { service } = setup({
      composerLocked: false,
      // Called while `setup` renders, so the service is looked up by the name `setup` gave it.
      welcomeContent: () =>
        AutopilotChatService.getInstance(
          `wind-composer-lock-${instanceCounter}`
        )?.setComposerLocked(true),
    });

    expect(service.getComposerLocked()).toBe(true);
    expect(textbox()).toBeDisabled();
  });

  it('follows the draft the host sets while locked', () => {
    const { service } = setup();

    act(() => service.setPrompt('Prefilled by the host'));

    expect(textbox()).toHaveValue('Prefilled by the host');
    expect(textbox()).toBeDisabled();
  });

  it('still stops a reply', async () => {
    const { service } = setup({ composerLocked: false });
    const stopped = vi.fn();
    service.on(AutopilotChatEvent.StopResponse, stopped);
    await userEvent.type(textbox(), 'Hi{Enter}');
    await waitFor(() => expect(submit()).toHaveAccessibleName('Stop'));

    act(() => service.setComposerLocked(true));
    expect(submit()).toBeEnabled();
    await userEvent.click(submit());

    expect(stopped).toHaveBeenCalledTimes(1);
  });

  it('takes focus on unlock when focus was in the welcome content', async () => {
    const { service } = setup({
      welcomeContent: (container) => {
        const button = document.createElement('button');
        button.textContent = 'Start';
        container.append(button);
      },
    });
    screen.getByRole('button', { name: 'Start' }).focus();

    act(() => service.setComposerLocked(false));

    expect(textbox()).toHaveFocus();
  });

  it('takes focus on unlock even when the host removes the focused control at once', () => {
    const { service } = setup({
      welcomeContent: (container) => {
        const button = document.createElement('button');
        button.textContent = 'Start';
        container.append(button);
      },
    });
    const start = screen.getByRole('button', { name: 'Start' });
    start.focus();

    act(() => {
      service.setComposerLocked(false);
      start.remove();
    });

    expect(textbox()).toHaveFocus();
  });

  it('leaves focus alone on unlock when it is not in the welcome content', () => {
    const { service } = setup();

    act(() => service.setComposerLocked(false));
    expect(textbox()).not.toHaveFocus();

    act(() => service.setComposerLocked(true));
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    act(() => service.setComposerLocked(false));

    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('leaves the Material composer as it is', async () => {
    setup({ renderer: 'material' });

    // Material loads lazily; its submit button says it is up.
    await screen.findByTestId('autopilot-chat-submit-button', undefined, { timeout: 25_000 });
    expect(document.querySelector('[contenteditable]')).toHaveAttribute('contenteditable', 'true');
  });
});
