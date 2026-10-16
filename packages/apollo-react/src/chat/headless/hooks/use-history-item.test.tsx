import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AutopilotChatEvent,
  type AutopilotChatHistory,
  AutopilotChatPreHookAction,
  AutopilotChatService,
} from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotLoadingProvider } from '../providers/loading-provider';
import { type HistoryItemState, useHistoryItem } from './use-history-item';

let instanceCounter = 0;
let state: HistoryItemState | undefined;

const ITEM: AutopilotChatHistory = {
  id: 'c1',
  name: 'Invoices',
  timestamp: new Date().toISOString(),
};

function Probe({ historyOpen }: { historyOpen: boolean }) {
  state = useHistoryItem(ITEM, historyOpen);
  return null;
}

function setup({
  historyOpen = true,
  preHook,
}: {
  historyOpen?: boolean;
  preHook?: Partial<Record<AutopilotChatPreHookAction, () => Promise<boolean>>>;
} = {}) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `use-history-item-${++instanceCounter}`,
    config: { preHooks: preHook },
  });
  const events: Array<[string, unknown]> = [];
  for (const event of [
    AutopilotChatEvent.RenameConversation,
    AutopilotChatEvent.DeleteConversation,
    AutopilotChatEvent.OpenConversation,
    AutopilotChatEvent.NewChat,
  ]) {
    service.on(event, (payload: unknown) => events.push([event, payload]));
  }
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotLoadingProvider>
        <Probe historyOpen={historyOpen} />
      </AutopilotLoadingProvider>
    </AutopilotChatServiceProvider>
  );
  return { service, events };
}

describe('useHistoryItem', () => {
  it('opens the conversation and closes the history, once, while it is not active', () => {
    const { service, events } = setup();
    act(() => service.toggleHistory(true));

    act(() => state?.open());
    expect(events).toEqual([[AutopilotChatEvent.OpenConversation, 'c1']]);
    expect(service.historyOpen).toBe(false);
    expect(state?.isActive).toBe(true);

    act(() => state?.open());
    expect(events).toHaveLength(1);

    act(() => service.openConversation('c2'));
    expect(state?.isActive).toBe(false);
  });

  it('renames through the pre-hook, trimming, and cancels an empty or unchanged name', async () => {
    const { events } = setup();

    act(() => state?.startRename());
    expect(state?.isEditing).toBe(true);
    expect(state?.draftName).toBe('Invoices');

    act(() => state?.setDraftName('  '));
    act(() => state?.commitRename());
    expect(state?.isEditing).toBe(false);

    act(() => state?.startRename());
    act(() => state?.setDraftName('  Vendor invoices '));
    act(() => state?.commitRename());
    // The blur after Enter does not rename twice.
    act(() => state?.commitRename());
    await waitFor(() => expect(state?.isEditing).toBe(false));
    expect(events).toEqual([
      [AutopilotChatEvent.RenameConversation, { conversationId: 'c1', name: 'Vendor invoices' }],
    ]);
  });

  it('cancels the rename when the pre-hook declines or fails', async () => {
    const decline = vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('no'));
    const { events } = setup({
      preHook: { [AutopilotChatPreHookAction.RenameConversation]: decline },
    });

    for (let attempt = 0; attempt < 2; attempt++) {
      act(() => state?.startRename());
      act(() => state?.setDraftName('Other'));
      act(() => state?.commitRename());
      await waitFor(() => expect(state?.isEditing).toBe(false));
      expect(state?.draftName).toBe('Invoices');
    }
    expect(decline).toHaveBeenCalledTimes(2);
    expect(events).toEqual([]);
  });

  it('does not start renaming while the history is closed', () => {
    setup({ historyOpen: false });

    act(() => state?.startRename());

    expect(state?.isEditing).toBe(false);
  });

  it('deletes through the pre-hook, keeping the conversation when it declines or fails', async () => {
    const confirm = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('no'))
      .mockResolvedValue(true);
    const { events } = setup({
      preHook: { [AutopilotChatPreHookAction.DeleteConversation]: confirm },
    });

    await act(async () => state?.remove());
    await act(async () => state?.remove());
    expect(events).toEqual([]);

    await act(async () => state?.remove());
    expect(events).toEqual([[AutopilotChatEvent.DeleteConversation, 'c1']]);
  });

  it('does not rename on the blur that follows Escape', async () => {
    const { events } = setup();
    act(() => state?.startRename());
    act(() => state?.setDraftName('Other'));

    act(() => state?.cancelRename());
    act(() => state?.commitRename());

    await act(async () => {});
    expect(events).toEqual([]);
  });
});
