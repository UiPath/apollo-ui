import { act, render, screen, waitFor, within } from '@testing-library/react';
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
  service.on(AutopilotChatEvent.HistorySearch, (payload: unknown) =>
    events.push([AutopilotChatEvent.HistorySearch, payload])
  );
  service.setHistory(HISTORY);
  render(<ApChat chatServiceInstance={service} />);
  await screen.findByTestId('autopilot-chat-history', {}, { timeout: 25_000 });
  return { service, events };
}

const openHistory = async (service: AutopilotChatService) => {
  act(() => service.toggleHistory(true));
  return screen.findByRole('presentation');
};

describe('Material chat history and settings', () => {
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
