import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  type AutopilotChatHistory,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const DAY = 86_400_000;

const HISTORY: AutopilotChatHistory[] = [
  { id: 'a', name: 'Invoice batch', timestamp: new Date(Date.now() - 60_000).toISOString() },
  { id: 'b', name: 'Vendor list', timestamp: new Date(Date.now() - 3 * DAY).toISOString() },
  { id: 'c', name: 'Old payroll', timestamp: new Date(Date.now() - 70 * DAY).toISOString() },
];

function setup(config: Partial<AutopilotChatConfiguration> = {}) {
  const embeddedContainer = document.createElement('div');
  document.body.append(embeddedContainer);
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-history-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.Embedded,
      embeddedContainer,
      disabledFeatures: { history: false, renameChat: false },
      ...config,
    },
  });
  const events: Array<[string, unknown]> = [];
  for (const event of [
    AutopilotChatEvent.OpenConversation,
    AutopilotChatEvent.RenameConversation,
    AutopilotChatEvent.DeleteConversation,
    AutopilotChatEvent.HistorySearch,
    AutopilotChatEvent.HistoryLoadMore,
  ]) {
    service.on(event, (payload: unknown) => events.push([event, payload]));
  }
  service.setHistory(HISTORY);
  render(<ApChat chatServiceInstance={service} />);
  return { service, events };
}

// By test id, as the other header buttons are.
const historyButton = () => screen.getByTestId('autopilot-chat-history');
const panel = () => document.querySelector('[data-slot="wind-chat-history"]') as HTMLElement | null;
const names = () =>
  [...document.querySelectorAll('[data-slot="wind-chat-history-item"] > button')].map(
    (item) => item.textContent
  );

describe('Wind chat history', () => {
  it('opens under the header in Embedded, grouped by date, and searches by name', async () => {
    setup();

    await userEvent.click(historyButton());

    expect(historyButton()).toHaveAttribute('aria-expanded', 'true');
    const dialog = await screen.findByRole('dialog', { name: 'Chat history' });
    expect(
      within(dialog)
        .getAllByRole('heading')
        .map((heading) => heading.textContent)
    ).toEqual(['Today', 'Last week', '2 months ago']);
    expect(names()).toEqual(['Invoice batch', 'Vendor list', 'Old payroll']);
    await waitFor(() => expect(within(dialog).getByRole('searchbox')).toHaveFocus());

    await userEvent.type(within(dialog).getByRole('searchbox'), 'VENDOR');
    expect(names()).toEqual(['Vendor list']);

    await userEvent.type(within(dialog).getByRole('searchbox'), 'x');
    expect(
      within(dialog).getByText('No results found.').closest('[data-slot="empty-state"]')
    ).toHaveAttribute('data-size', 'compact');
    expect(within(dialog).queryByRole('heading')).toBeNull();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Clear search' }));
    expect(names()).toEqual(['Invoice batch', 'Vendor list', 'Old payroll']);
    expect(within(dialog).getByRole('searchbox')).toHaveValue('');
    expect(within(dialog).getByRole('searchbox')).toHaveFocus();
    expect(within(dialog).queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('shows the empty state without a search when there is no history', async () => {
    const { service } = setup();
    act(() => service.setHistory([]));

    await userEvent.click(historyButton());

    const empty = await screen.findByText('There are no conversations yet.');
    expect(empty.closest('[data-slot="empty-state"]')).toHaveAttribute('data-size', 'compact');
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('opens a conversation and closes, marking it as the open one', async () => {
    const { service, events } = setup();
    act(() => service.toggleHistory(true));

    await userEvent.click(await screen.findByRole('button', { name: 'Vendor list' }));

    expect(events).toEqual([[AutopilotChatEvent.OpenConversation, 'b']]);
    await waitFor(() => expect(panel()).toBeNull());
    expect(service.historyOpen).toBe(false);

    act(() => service.toggleHistory(true));
    expect(await screen.findByRole('button', { name: 'Vendor list' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('closes on Escape and returns focus to the history button', async () => {
    const { service } = setup();
    await userEvent.click(historyButton());
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(panel()).toBeNull());
    expect(service.historyOpen).toBe(false);
    expect(historyButton()).toHaveFocus();
  });

  it('renames with Enter, cancels with Escape without closing, and deletes', async () => {
    const { events } = setup();
    await userEvent.click(historyButton());
    await screen.findByRole('dialog');
    const row = () =>
      screen.getByRole('button', { name: 'Invoice batch' }).closest('li') as HTMLElement;

    await userEvent.click(within(row()).getByTestId('autopilot-chat-history-rename'));
    const field = screen.getByRole('textbox', { name: 'Chat name' });
    expect(field).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Chat name' })).toBeNull();

    await userEvent.click(within(row()).getByTestId('autopilot-chat-history-rename'));
    await userEvent.clear(screen.getByRole('textbox', { name: 'Chat name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Chat name' }), 'Invoices{Enter}');
    await waitFor(() =>
      expect(events).toEqual([
        [AutopilotChatEvent.RenameConversation, { conversationId: 'a', name: 'Invoices' }],
      ])
    );

    await userEvent.click(within(row()).getByTestId('autopilot-chat-history-delete'));
    await waitFor(() =>
      expect(events).toContainEqual([AutopilotChatEvent.DeleteConversation, 'a'])
    );
  });

  it('stays usable beside a host dialog from a pre-hook, and closes on a click elsewhere', async () => {
    const confirmInDialog = () =>
      new Promise<boolean>((resolve) => {
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        const confirm = document.createElement('button');
        confirm.textContent = 'Confirm';
        confirm.addEventListener('click', () => {
          dialog.remove();
          resolve(true);
        });
        dialog.append(confirm);
        document.body.append(dialog);
        confirm.focus();
      });
    const { events } = setup({
      preHooks: { [AutopilotChatPreHookAction.DeleteConversation]: confirmInDialog },
    });
    await userEvent.click(historyButton());
    await screen.findByRole('dialog', { name: 'Chat history' });
    const row = screen.getByRole('button', { name: 'Vendor list' }).closest('li') as HTMLElement;

    await userEvent.click(within(row).getByTestId('autopilot-chat-history-delete'));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(events).toContainEqual([AutopilotChatEvent.DeleteConversation, 'b'])
    );
    expect(panel()).not.toBeNull();

    // A click elsewhere in the chat closes it and leaves focus where the click put it.
    const textbox = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.click(textbox);
    await waitFor(() => expect(panel()).toBeNull());
    expect(textbox).toHaveFocus();
  });

  it('closes from its header button without reopening', async () => {
    const { service } = setup();
    await userEvent.click(historyButton());
    await screen.findByRole('dialog', { name: 'Chat history' });

    await userEvent.click(historyButton());

    await waitFor(() => expect(panel()).toBeNull());
    expect(service.historyOpen).toBe(false);
  });

  it('hides rename with disabledFeatures.renameChat', async () => {
    setup({ disabledFeatures: { history: false, renameChat: true } });
    await userEvent.click(historyButton());
    await screen.findByRole('dialog');

    expect(screen.queryByTestId('autopilot-chat-history-rename')).toBeNull();
    expect(screen.getAllByTestId('autopilot-chat-history-delete')).toHaveLength(3);
  });

  it('shows the host search and load-more states when paginated', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { service, events } = setup({ paginatedHistory: true });
      act(() => service.setHistory(HISTORY, false));
      act(() => service.toggleHistory(true));
      const searchbox = await screen.findByRole('searchbox');

      await userEvent.type(searchbox, 'inv');
      expect(document.querySelector('[data-slot="wind-chat-history-skeleton"]')).not.toBeNull();
      act(() => vi.advanceTimersByTime(400));
      expect(events).toContainEqual([AutopilotChatEvent.HistorySearch, { searchText: 'inv' }]);

      act(() => service.setHistory([HISTORY[0]!], false));
      expect(document.querySelector('[data-slot="wind-chat-history-skeleton"]')).toBeNull();
      expect(names()).toEqual(['Invoice batch']);

      // happy-dom lays nothing out, so any scroll is at the end of the list.
      const list = document.querySelector('[data-slot="wind-chat-history-list"]') as HTMLElement;
      act(() => list.dispatchEvent(new Event('scroll')));
      expect(events).toContainEqual([AutopilotChatEvent.HistoryLoadMore, { searchText: 'inv' }]);
      expect(screen.getByRole('status', { name: 'Loading more chats' })).toBeInTheDocument();

      act(() => service.appendOlderHistoryItems([HISTORY[1]!], true));
      expect(screen.queryByRole('status', { name: 'Loading more chats' })).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('is a popover in FullScreen too, with the column making room for it', async () => {
    const { service } = setup({ mode: AutopilotChatMode.FullScreen });

    await userEvent.click(historyButton());

    const dialog = await screen.findByRole('dialog', { name: 'Chat history' });
    await waitFor(() => expect(within(dialog).getByRole('searchbox')).toHaveFocus());
    expect(document.querySelector('main + [aria-hidden]')).not.toBeNull();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
    expect(service.historyOpen).toBe(false);
    expect(historyButton()).toHaveFocus();
    expect(document.querySelector('main + [aria-hidden]')).toBeNull();
  });

  it('clears the search on close, resetting a paginated host to the full list', async () => {
    const { service, events } = setup({ paginatedHistory: true });
    act(() => service.setHistory(HISTORY, false));
    act(() => service.toggleHistory(true));
    await userEvent.type(await screen.findByRole('searchbox'), 'inv');
    await waitFor(() =>
      expect(events).toContainEqual([AutopilotChatEvent.HistorySearch, { searchText: 'inv' }])
    );
    act(() => service.setHistory([HISTORY[0]!], true));

    act(() => service.toggleHistory(false));
    expect(events.at(-1)).toEqual([AutopilotChatEvent.HistorySearch, { searchText: '' }]);
    act(() => service.setHistory(HISTORY, false));

    act(() => service.toggleHistory(true));
    expect(await screen.findByRole('searchbox')).toHaveValue('');
    expect(names()).toEqual(['Invoice batch', 'Vendor list', 'Old payroll']);
  });

  it('keeps knowing the host is done between openings', async () => {
    const { service, events } = setup({ paginatedHistory: true });
    act(() => service.setHistory(HISTORY, true));
    act(() => service.toggleHistory(true));
    await screen.findByRole('searchbox');
    act(() => service.toggleHistory(false));
    await waitFor(() => expect(panel()).toBeNull());

    act(() => service.toggleHistory(true));
    await screen.findByRole('searchbox');
    const list = document.querySelector('[data-slot="wind-chat-history-list"]') as HTMLElement;
    act(() => list.dispatchEvent(new Event('scroll')));

    expect(events.filter(([event]) => event === AutopilotChatEvent.HistoryLoadMore)).toEqual([]);
  });
});
