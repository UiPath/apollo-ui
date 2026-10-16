import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import debounce from 'debounce';
import React from 'react';

import {
  AutopilotChatEvent,
  type AutopilotChatHistory,
  type AutopilotChatHistorySearchPayload,
  AutopilotChatInternalEvent,
} from '../../service';
import {
  type ChatHistoryBucket,
  type ChatHistoryGroup,
  filterHistory,
  groupHistory,
} from '../history/history-groups';
import { useChatService } from '../providers/chat-service.provider';
import { publishChatEvent } from '../utils/publish-chat-event';

export const HISTORY_SEARCH_DEBOUNCE_MS = 400;
/** How close to the end of the list scrolling asks the host for older items. */
export const HISTORY_LOAD_MORE_THRESHOLD_PX = 50;

export interface TitledChatHistoryGroup extends ChatHistoryGroup {
  title: string;
}

export interface ChatHistoryState {
  history: AutopilotChatHistory[];
  groups: TitledChatHistoryGroup[];
  searchQuery: string;
  setSearchQuery: (query: string | undefined) => void;
  /** The host paginates history (`paginatedHistory`): it searches and loads older items. */
  paginated: boolean;
  /** A paginated search is waiting for the host's results. */
  showSearchSkeleton: boolean;
  /** The host is loading older items. */
  showLoadingMore: boolean;
  /** Show the search field and the list; otherwise the list is empty, with no search under way. */
  hasHistoryData: boolean;
  noSearchResults: boolean;
}

/** The localized title of a date bucket. */
export function useHistoryGroupTitle() {
  const { _ } = useLingui();

  return React.useCallback(
    (bucket: ChatHistoryBucket) => {
      switch (bucket.kind) {
        case 'today':
          return _(msg({ id: 'autopilot-chat.history.group.today', message: `Today` }));
        case 'yesterday':
          return _(msg({ id: 'autopilot-chat.history.group.yesterday', message: `Yesterday` }));
        case 'last-week':
          return _(msg({ id: 'autopilot-chat.history.group.last-week', message: `Last 7 days` }));
        case 'last-30-days':
          return _(
            msg({ id: 'autopilot-chat.history.group.last-30-days', message: `Last 30 days` })
          );
        case 'months-ago': {
          const count = bucket.count;
          return _(
            msg({ id: 'autopilot-chat.history.group.months-ago', message: `${count} months ago` })
          );
        }
      }
    },
    [_]
  );
}

/**
 * The history list for every renderer: the service's history grouped by date, search (client side,
 * or debounced `HistorySearch` when the host paginates), and `HistoryLoadMore` when
 * `scrollContainer` is scrolled near its end, keeping the scroll position when older items append.
 *
 * A first page too short to scroll asks for more as soon as the list has its size.
 *
 * Keep it mounted while the history is closed. Closing clears the search, and the list follows
 * the box, so a paginated host is sent an empty `HistorySearch` to reset its results. Deleting the
 * open conversation starts a new chat.
 */
export function useChatHistory({
  open,
  scrollContainer,
}: {
  open: boolean;
  scrollContainer: HTMLElement | null;
}): ChatHistoryState {
  const chatService = useChatService();
  const internalService = chatService.__internalService__;
  const groupTitle = useHistoryGroupTitle();
  const paginated = !!chatService.getConfig()?.paginatedHistory;

  const [history, setHistory] = React.useState<AutopilotChatHistory[]>(
    () => chatService.getHistory() ?? []
  );
  const [searchQuery, setSearchQueryState] = React.useState('');
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  const isLoadingMoreRef = React.useRef(false);
  // Seeded from the service, so a list mounted after the host's last page does not ask again.
  const hasMoreRef = React.useRef(chatService.__hasMoreHistory__);
  const appendingRef = React.useRef(false);
  const scrollTopBeforeAppendRef = React.useRef(0);
  const searchQueryRef = React.useRef('');
  // The query the host last searched for, so a reset is sent only when its list is filtered.
  const sentQueryRef = React.useRef('');

  React.useEffect(() => {
    const unsubscribeSetHistory = chatService.on(
      AutopilotChatEvent.SetHistory,
      (next: AutopilotChatHistory[]) => {
        setHistory(next);
        setIsSearching(false);
      }
    );
    const unsubscribeLoadingMore = internalService.on(
      AutopilotChatInternalEvent.SetIsLoadingMoreHistory,
      (value: boolean) => {
        isLoadingMoreRef.current = value;
        setIsLoadingMore(value);
      }
    );
    const unsubscribeHasMore = internalService.on(
      AutopilotChatInternalEvent.ShouldShowLoadingMoreHistory,
      (value: boolean) => {
        hasMoreRef.current = value;
      }
    );
    // The service forgets the open conversation before announcing its deletion, so it is tracked
    // here from the events.
    let activeId = chatService.activeConversationId;
    const unsubscribeOpen = chatService.on(
      AutopilotChatEvent.OpenConversation,
      (id: string | null) => {
        activeId = id;
      }
    );
    const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
      activeId = null;
    });
    const unsubscribeDelete = chatService.on(
      AutopilotChatEvent.DeleteConversation,
      (id: string) => {
        if (id === activeId) {
          chatService.newChat();
        }
      }
    );
    const unsubscribeAppend = internalService.on(
      AutopilotChatInternalEvent.AppendOlderHistory,
      () => {
        if (scrollContainer) {
          appendingRef.current = true;
          scrollTopBeforeAppendRef.current = scrollContainer.scrollTop;
        }
      }
    );

    return () => {
      unsubscribeSetHistory();
      unsubscribeLoadingMore();
      unsubscribeHasMore();
      unsubscribeOpen();
      unsubscribeNewChat();
      unsubscribeDelete();
      unsubscribeAppend();
    };
  }, [chatService, internalService, scrollContainer]);

  const loadMoreAtEnd = React.useCallback(() => {
    if (!scrollContainer) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

    if (
      scrollHeight - scrollTop - clientHeight < HISTORY_LOAD_MORE_THRESHOLD_PX &&
      !isLoadingMoreRef.current &&
      hasMoreRef.current &&
      chatService.getConfig()?.paginatedHistory
    ) {
      publishChatEvent(chatService, AutopilotChatEvent.HistoryLoadMore, {
        searchText: searchQueryRef.current,
      } satisfies AutopilotChatHistorySearchPayload);
      internalService.publish(AutopilotChatInternalEvent.SetIsLoadingMoreHistory, true);
    }
  }, [scrollContainer, chatService, internalService]);

  React.useEffect(() => {
    if (!scrollContainer || !open) {
      return;
    }
    scrollContainer.addEventListener('scroll', loadMoreAtEnd, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', loadMoreAtEnd);
  }, [scrollContainer, open, loadMoreAtEnd]);

  // A list that does not fill its container never scrolls, so the same check runs whenever the
  // list changes: once the container has a real height and two frames have passed, so the
  // layout (and the popover's position) has settled.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-checks after each history update
  React.useLayoutEffect(() => {
    if (!scrollContainer || !open) {
      return;
    }
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (scrollContainer.clientHeight > 0) {
          loadMoreAtEnd();
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [history, open, scrollContainer, loadMoreAtEnd]);

  // Appending older items keeps the reader where they were.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after each history update
  React.useLayoutEffect(() => {
    if (appendingRef.current && scrollContainer) {
      scrollContainer.scrollTop = scrollTopBeforeAppendRef.current;
      appendingRef.current = false;
    }
  }, [history, scrollContainer]);

  const debouncedSearch = React.useMemo(
    () =>
      debounce((searchText: string) => {
        if (chatService.getConfig()?.paginatedHistory) {
          sentQueryRef.current = searchText;
          publishChatEvent(chatService, AutopilotChatEvent.HistorySearch, {
            searchText,
          } satisfies AutopilotChatHistorySearchPayload);
          internalService.publish(AutopilotChatInternalEvent.SetIsLoadingMoreHistory, false);
        }
      }, HISTORY_SEARCH_DEBOUNCE_MS),
    [chatService, internalService]
  );

  React.useEffect(() => () => debouncedSearch.clear(), [debouncedSearch]);

  // Closing (or unmounting) clears the search, and the host's filtered results with it. A search
  // still waiting out the pause is dropped.
  const resetSearch = React.useCallback(() => {
    debouncedSearch.clear();
    if (searchQueryRef.current !== '') {
      searchQueryRef.current = '';
      setSearchQueryState('');
    }
    setIsSearching(false);

    if (chatService.getConfig()?.paginatedHistory && sentQueryRef.current !== '') {
      // No skeleton for the empty search: a host may ignore it, and keeps showing its list then.
      sentQueryRef.current = '';
      publishChatEvent(chatService, AutopilotChatEvent.HistorySearch, {
        searchText: '',
      } satisfies AutopilotChatHistorySearchPayload);
      internalService.publish(AutopilotChatInternalEvent.SetIsLoadingMoreHistory, false);
    }
  }, [chatService, internalService, debouncedSearch]);

  React.useEffect(() => {
    if (!open) {
      resetSearch();
    }
  }, [open, resetSearch]);

  const resetSearchRef = React.useRef(resetSearch);
  resetSearchRef.current = resetSearch;
  React.useEffect(() => () => resetSearchRef.current(), []);

  const setSearchQuery = React.useCallback(
    (query: string | undefined) => {
      const next = query || '';
      searchQueryRef.current = next;
      setSearchQueryState(next);

      if (chatService.getConfig()?.paginatedHistory) {
        // The skeleton waits for the results of a query; an emptied box keeps the list shown.
        setIsSearching(next !== '');
        debouncedSearch(next);
      }
    },
    [chatService, debouncedSearch]
  );

  const groups = React.useMemo(
    () =>
      groupHistory(paginated ? history : filterHistory(history, searchQuery)).map((group) => ({
        ...group,
        title: groupTitle(group.bucket),
      })),
    [history, searchQuery, paginated, groupTitle]
  );

  return {
    history,
    groups,
    searchQuery,
    setSearchQuery,
    paginated,
    showSearchSkeleton: isSearching && paginated,
    showLoadingMore: isLoadingMore && paginated,
    hasHistoryData: history.length > 0 || !!searchQuery || isSearching,
    noSearchResults: groups.length === 0 && !!searchQuery,
  };
}
