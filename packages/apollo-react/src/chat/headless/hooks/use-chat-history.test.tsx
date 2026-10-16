import { act, render, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApI18nProvider } from '../../../i18n';
import { AutopilotChatEvent, type AutopilotChatHistory, AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import {
  type ChatHistoryState,
  HISTORY_LOAD_MORE_THRESHOLD_PX,
  HISTORY_SEARCH_DEBOUNCE_MS,
  useChatHistory,
} from './use-chat-history';

let instanceCounter = 0;
let state: ChatHistoryState | undefined;

const entries = (count: number, prefix = 'Chat'): AutopilotChatHistory[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix} ${index}`,
    timestamp: new Date(Date.now() - index * 60_000).toISOString(),
  }));

function firstGroup() {
  const group = state?.groups[0];
  if (!group) throw new Error('no history group');
  return group;
}

function Probe({
  scrollContainer,
  open = true,
}: {
  scrollContainer: HTMLElement | null;
  open?: boolean;
}) {
  state = useChatHistory({ open, scrollContainer });
  return null;
}

function setup(
  paginated: boolean,
  scrollContainer: HTMLElement | null = null,
  before?: (service: AutopilotChatService) => void
) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `use-chat-history-${++instanceCounter}`,
    config: { paginatedHistory: paginated },
  });
  before?.(service);
  const events: Array<[string, unknown]> = [];
  for (const event of [AutopilotChatEvent.HistorySearch, AutopilotChatEvent.HistoryLoadMore]) {
    service.on(event, (payload: unknown) => events.push([event, payload]));
  }
  const wrap = (node: React.ReactNode) => (
    <ApI18nProvider component="chat">
      <AutopilotChatServiceProvider chatServiceInstance={service}>
        {node}
      </AutopilotChatServiceProvider>
    </ApI18nProvider>
  );
  const view = render(wrap(<Probe scrollContainer={scrollContainer} />));
  const setOpen = (open: boolean) =>
    view.rerender(wrap(<Probe scrollContainer={scrollContainer} open={open} />));
  return { service, events, setOpen, unmount: view.unmount };
}

/** A scroll container whose metrics the test sets. */
function scroller(scrollHeight: number, clientHeight: number) {
  const element = document.createElement('div');
  Object.defineProperty(element, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(element, 'clientHeight', { value: clientHeight, configurable: true });
  return element;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useChatHistory', () => {
  it('filters on the client without pagination, with the empty and no-result flags', () => {
    const { service } = setup(false);
    expect(state?.hasHistoryData).toBe(false);

    act(() => service.setHistory([...entries(2), ...entries(1, 'Invoice')]));
    expect(state?.groups.map((group) => group.title)).toEqual(['Today']);
    expect(firstGroup().items).toHaveLength(3);

    act(() => state?.setSearchQuery('invoice'));
    expect(firstGroup().items.map((item) => item.name)).toEqual(['Invoice 0']);
    expect(state?.showSearchSkeleton).toBe(false);

    act(() => state?.setSearchQuery('nothing'));
    expect(state?.noSearchResults).toBe(true);
    expect(state?.hasHistoryData).toBe(true);
  });

  it('asks the host to search when paginated, after a pause, until its results arrive', () => {
    vi.useFakeTimers();
    const { service, events } = setup(true);
    act(() => service.setHistory(entries(3), false));

    act(() => state?.setSearchQuery('in'));
    act(() => state?.setSearchQuery('inv'));
    expect(state?.showSearchSkeleton).toBe(true);
    // Paginated: the list is the host's, not filtered here.
    expect(firstGroup().items).toHaveLength(3);
    expect(events).toEqual([]);

    act(() => vi.advanceTimersByTime(HISTORY_SEARCH_DEBOUNCE_MS));
    expect(events).toEqual([[AutopilotChatEvent.HistorySearch, { searchText: 'inv' }]]);

    act(() => service.setHistory(entries(1, 'Invoice'), true));
    expect(state?.showSearchSkeleton).toBe(false);
    expect(firstGroup().items.map((item) => item.name)).toEqual(['Invoice 0']);
  });

  it('clears the search on close, resetting a paginated host once, only if it searched', () => {
    vi.useFakeTimers();
    const { service, events, setOpen } = setup(true);
    act(() => service.setHistory(entries(3), false));

    // Closing before the pause ends drops the search; the host never filtered, so no reset.
    act(() => state?.setSearchQuery('inv'));
    act(() => setOpen(false));
    act(() => vi.advanceTimersByTime(HISTORY_SEARCH_DEBOUNCE_MS));
    expect(events).toEqual([]);
    expect(state?.searchQuery).toBe('');
    expect(state?.showSearchSkeleton).toBe(false);

    act(() => setOpen(true));
    act(() => state?.setSearchQuery('inv'));
    act(() => vi.advanceTimersByTime(HISTORY_SEARCH_DEBOUNCE_MS));
    act(() => setOpen(false));
    expect(events).toEqual([
      [AutopilotChatEvent.HistorySearch, { searchText: 'inv' }],
      [AutopilotChatEvent.HistorySearch, { searchText: '' }],
    ]);
    // No skeleton for the empty search, so a host that ignores it leaves no skeleton behind.
    expect(state?.showSearchSkeleton).toBe(false);

    act(() => setOpen(true));
    act(() => setOpen(false));
    expect(events).toHaveLength(2);
  });

  it('resets a filtered host when unmounted, even with the box already emptied', () => {
    vi.useFakeTimers();
    const { events, unmount } = setup(true);
    act(() => state?.setSearchQuery('inv'));
    act(() => vi.advanceTimersByTime(HISTORY_SEARCH_DEBOUNCE_MS));
    // Emptied, but the empty search is still waiting out the pause.
    act(() => state?.setSearchQuery(''));
    expect(state?.showSearchSkeleton).toBe(false);

    unmount();
    act(() => vi.advanceTimersByTime(HISTORY_SEARCH_DEBOUNCE_MS));

    expect(events).toEqual([
      [AutopilotChatEvent.HistorySearch, { searchText: 'inv' }],
      [AutopilotChatEvent.HistorySearch, { searchText: '' }],
    ]);
  });

  it('only clears the box on close without pagination', () => {
    const { service, events, setOpen } = setup(false);
    act(() => service.setHistory(entries(3)));
    act(() => state?.setSearchQuery('Chat 1'));

    act(() => setOpen(false));

    expect(state?.searchQuery).toBe('');
    expect(events).toEqual([]);
  });

  it('loads more near the end of the list, once at a time, until the host is done', () => {
    const container = scroller(1000, 400);
    const { service, events } = setup(true, container);
    act(() => service.setHistory(entries(10), false));
    const scrollTo = (top: number) =>
      act(() => {
        container.scrollTop = top;
        container.dispatchEvent(new Event('scroll'));
      });

    scrollTo(100);
    expect(events).toEqual([]);

    scrollTo(600 - HISTORY_LOAD_MORE_THRESHOLD_PX + 1);
    scrollTo(600);
    expect(events).toEqual([[AutopilotChatEvent.HistoryLoadMore, { searchText: '' }]]);
    expect(state?.showLoadingMore).toBe(true);

    // Older items keep the reader where they were.
    act(() => service.appendOlderHistoryItems(entries(5, 'Older'), true));
    expect(container.scrollTop).toBe(600);
    expect(state?.showLoadingMore).toBe(false);

    scrollTo(600);
    expect(events).toHaveLength(1);
  });

  it('loads more once the list has its size when the first page does not fill it', async () => {
    const container = scroller(300, 400);
    const { service, events } = setup(true, container, (s) => s.setHistory(entries(3), false));

    await waitFor(() =>
      expect(events).toEqual([[AutopilotChatEvent.HistoryLoadMore, { searchText: '' }]])
    );

    // Still short after the next page, but the host said it was the last: no more asks.
    act(() => service.appendOlderHistoryItems(entries(3, 'Older'), true));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(events).toHaveLength(1);
  });

  it('does not ask a host that was done before the list mounted', async () => {
    const container = scroller(300, 400);
    const { events } = setup(true, container, (s) => s.setHistory(entries(3), true));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(events).toEqual([]);
  });

  it('starts a new chat when the open conversation is deleted, whatever is shown', () => {
    const { service } = setup(false);
    const newChats: unknown[] = [];
    service.on(AutopilotChatEvent.NewChat, () => newChats.push(true));

    act(() => service.openConversation('a'));
    act(() => service.deleteConversation('b'));
    expect(newChats).toEqual([]);

    act(() => service.deleteConversation('a'));
    expect(newChats).toEqual([true]);
  });

  it('does not load more without pagination', () => {
    const container = scroller(1000, 400);
    const { service, events } = setup(false, container);
    act(() => service.setHistory(entries(10)));

    act(() => {
      container.scrollTop = 600;
      container.dispatchEvent(new Event('scroll'));
    });

    expect(events).toEqual([]);
  });
});
