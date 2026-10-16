import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApChat } from '@uipath/apollo-react/chat/root/ApChat';
import {
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  type AutopilotChatHistory,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  AutopilotChatService,
} from '@uipath/apollo-react/chat/service';
import { describe, expect, it, vi } from 'vitest';

let instanceCount = 0;
const DAY = 86_400_000;
const HISTORY: AutopilotChatHistory[] = [
  { id: 'a', name: 'Invoice batch', timestamp: new Date(Date.now() - 60_000).toISOString() },
  { id: 'b', name: 'Vendor list', timestamp: new Date(Date.now() - 3 * DAY).toISOString() },
];

// Material on the shared history hooks: the list, search, opening, rename, delete, load more
// and the settings container.
async function setup(config: Partial<AutopilotChatConfiguration> = {}) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `material-history-${instanceCount++}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      renderer: 'material',
      disabledFeatures: { history: false, renameChat: false },
      ...config,
    },
  });
  const events: Array<[string, unknown]> = [];
  for (const event of [
    AutopilotChatEvent.OpenConversation,
    AutopilotChatEvent.RenameConversation,
    AutopilotChatEvent.DeleteConversation,
    AutopilotChatEvent.HistoryLoadMore,
    AutopilotChatEvent.HistorySearch,
  ]) {
    service.on(event, (payload: unknown) => events.push([event, payload]));
  }
  service.setHistory(HISTORY);
  render(<ApChat chatServiceInstance={service} />);
  await screen.findByTestId('autopilot-chat-history', {}, { timeout: 25_000 });
  return { service, events };
}

const openHistory = async (service: AutopilotChatService) => {
  act(() => service.toggleHistory(true));
  return screen.findByRole('presentation');
};

describe('Material chat history on the shared hooks', () => {
  it('groups by date and filters by name', async () => {
    const { service } = await setup();
    const popover = await openHistory(service);

    expect(within(popover).getByText('Today')).toBeInTheDocument();
    expect(within(popover).getByText('Last week')).toBeInTheDocument();

    await userEvent.type(within(popover).getByPlaceholderText('Search'), 'vendor');

    expect(within(popover).queryByRole('button', { name: 'Invoice batch' })).toBeNull();
    expect(within(popover).getByRole('button', { name: 'Vendor list' })).toBeInTheDocument();
  }, 30_000);

  it('opens a conversation and closes the history', async () => {
    const { service, events } = await setup();
    const popover = await openHistory(service);

    await userEvent.click(within(popover).getByRole('button', { name: 'Vendor list' }));

    expect(events).toEqual([[AutopilotChatEvent.OpenConversation, 'b']]);
    expect(service.historyOpen).toBe(false);
  }, 30_000);

  it('renames with Enter and deletes', async () => {
    const { service, events } = await setup();
    const popover = await openHistory(service);

    // A plain click: userEvent's focus moves leave the field before it is filled in happy-dom.
    fireEvent.click(within(popover).getAllByTestId('autopilot-chat-history-rename')[0]!);
    const field = within(popover).getByTestId('autopilot-chat-history-rename-input');
    await userEvent.clear(field);
    await userEvent.type(field, 'Invoices{Enter}');
    await waitFor(() =>
      expect(events).toContainEqual([
        AutopilotChatEvent.RenameConversation,
        { conversationId: 'a', name: 'Invoices' },
      ])
    );

    await userEvent.click(within(popover).getAllByTestId('autopilot-chat-history-delete')[1]!);
    await waitFor(() =>
      expect(events).toContainEqual([AutopilotChatEvent.DeleteConversation, 'b'])
    );
  }, 30_000);

  it('loads more when paginated and scrolled to the end', async () => {
    const { service, events } = await setup({ paginatedHistory: true });
    act(() => service.setHistory(HISTORY, false));
    const popover = await openHistory(service);

    const list = popover.querySelector('.chat-history-content') as HTMLElement;
    act(() => list.dispatchEvent(new Event('scroll')));

    expect(events).toContainEqual([AutopilotChatEvent.HistoryLoadMore, { searchText: '' }]);
  }, 30_000);

  it('renders the host settings into one container on each opening', async () => {
    const settingsRenderer = vi.fn((container: HTMLElement) => {
      container.append(document.createElement('form'));
    });
    const { service } = await setup({
      disabledFeatures: { settings: false },
      settingsRenderer,
    });

    act(() => service.toggleSettings(true));
    await waitFor(() => expect(settingsRenderer).toHaveBeenCalledTimes(1));
    const container = settingsRenderer.mock.calls[0]![0];
    expect(container.children).toHaveLength(1);

    act(() => service.toggleSettings(false));
    expect(container.children).toHaveLength(0);

    act(() => service.toggleSettings(true));
    expect(settingsRenderer).toHaveBeenCalledTimes(2);
    expect(settingsRenderer.mock.calls[1]![0]).toBe(container);
  }, 30_000);

  it('clears the search on close, resetting a paginated host', async () => {
    const { service, events } = await setup({ paginatedHistory: true });
    act(() => service.setHistory(HISTORY, false));
    const popover = await openHistory(service);
    await userEvent.type(within(popover).getByPlaceholderText('Search'), 'inv');
    await waitFor(() =>
      expect(events).toContainEqual([AutopilotChatEvent.HistorySearch, { searchText: 'inv' }])
    );

    act(() => service.toggleHistory(false));

    expect(events.at(-1)).toEqual([AutopilotChatEvent.HistorySearch, { searchText: '' }]);
  }, 30_000);

  it('closes the settings through the ToggleSettings pre-hook', async () => {
    const toggleSettings = vi.fn().mockResolvedValue(true);
    const toggleHistory = vi.fn().mockResolvedValue(true);
    const { service } = await setup({
      disabledFeatures: { settings: false },
      settingsRenderer: () => {},
      preHooks: {
        [AutopilotChatPreHookAction.ToggleSettings]: toggleSettings,
        [AutopilotChatPreHookAction.ToggleHistory]: toggleHistory,
      },
    });
    act(() => service.toggleSettings(true));

    await userEvent.click(await screen.findByTestId('autopilot-chat-settings-close'));

    await waitFor(() => expect(service.settingsOpen).toBe(false));
    expect(toggleSettings).toHaveBeenCalledWith({ settingsOpen: true });
    expect(toggleHistory).not.toHaveBeenCalled();
  }, 30_000);

  it('wraps the host settings rather than scrolling them sideways', async () => {
    const { service } = await setup({
      disabledFeatures: { settings: false },
      settingsRenderer: () => {},
    });
    act(() => service.toggleSettings(true));

    const content = document.querySelector('.chat-settings-content') as HTMLElement;
    expect(getComputedStyle(content).whiteSpace).toBe('normal');
    expect(getComputedStyle(content).overflowX).toBe('hidden');
  }, 30_000);
});
