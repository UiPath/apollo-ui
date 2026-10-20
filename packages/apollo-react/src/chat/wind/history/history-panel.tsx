import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { cn, EmptyState, Search, Skeleton, Spinner } from '@uipath/apollo-wind';
import React from 'react';

import type { ChatHistoryState } from '../../headless/hooks/use-chat-history';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { HistoryItem } from './history-item';

// Compact in both densities: the panel is a popover, where the default heading would add a stray
// entry to the page outline.
function EmptyMessage({ title }: { title: string }) {
  return <EmptyState size="compact" title={title} className="flex-1" />;
}

/**
 * The history list: search, conversations grouped by date, and the host's loading states.
 */
export function HistoryPanel({
  className,
  history,
  scrollContainerRef,
}: {
  className?: string;
  history: ChatHistoryState;
  scrollContainerRef: (element: HTMLDivElement | null) => void;
}) {
  const { _ } = useLingui();
  const { historyOpen } = useChatState();
  const idPrefix = React.useId();
  const {
    groups,
    searchQuery,
    setSearchQuery,
    hasHistoryData,
    noSearchResults,
    showSearchSkeleton,
    showLoadingMore,
  } = history;

  const searchLabel = _(
    msg({ id: 'autopilot-chat.history.search-placeholder', message: `Search chats` })
  );
  const searchStrings = React.useMemo(
    () => ({
      clear: _(msg({ id: 'autopilot-chat.history.search-clear', message: `Clear search` })),
    }),
    [_]
  );
  const searchInput = React.useRef<HTMLInputElement>(null);

  const renderList = () => {
    if (showSearchSkeleton) {
      return (
        <div data-slot="wind-chat-history-skeleton" className="flex flex-col gap-2 p-2">
          {Array.from({ length: 6 }, (_unused, index) => (
            <Skeleton key={index} className="h-6 w-[90%]" />
          ))}
        </div>
      );
    }
    if (noSearchResults) {
      return (
        <EmptyMessage
          title={_(msg({ id: 'autopilot-chat.history.no-results', message: `No results found` }))}
        />
      );
    }
    return (
      <>
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`${idPrefix}-${group.key}`}>
            <h2
              id={`${idPrefix}-${group.key}`}
              className="px-3 pt-3 pb-1 text-xs font-semibold text-foreground"
            >
              {group.title}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))}
        {showLoadingMore && (
          <Spinner
            size="sm"
            className="py-3"
            label={_(
              msg({ id: 'autopilot-chat.history.loading-more', message: `Loading more chats` })
            )}
          />
        )}
      </>
    );
  };

  return (
    <div data-slot="wind-chat-history" className={cn('flex min-h-0 flex-col gap-2', className)}>
      {hasHistoryData ? (
        <>
          <div className="shrink-0 px-2">
            <Search
              ref={searchInput}
              value={searchQuery}
              onChange={setSearchQuery}
              // The clear button goes away with the query; keep focus in the field.
              onClear={() => searchInput.current?.focus()}
              strings={searchStrings}
              placeholder={searchLabel}
              aria-label={searchLabel}
              disabled={!historyOpen}
            />
          </div>
          <div
            ref={scrollContainerRef}
            data-slot="wind-chat-history-list"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-1"
          >
            {renderList()}
          </div>
        </>
      ) : (
        <EmptyMessage
          title={_(msg({ id: 'autopilot-chat.history.empty', message: `No chat history` }))}
        />
      )}
    </div>
  );
}
