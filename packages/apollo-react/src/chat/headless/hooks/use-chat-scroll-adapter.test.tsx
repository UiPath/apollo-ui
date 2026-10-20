import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  AutopilotChatMode,
  AutopilotChatRole,
  AutopilotChatService,
} from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotLoadingProvider } from '../providers/loading-provider';
import { AutopilotStreamingProvider } from '../providers/streaming-provider';
import { useChatScrollAdapter } from './use-chat-scroll-adapter';

let instanceCounter = 0;

function Probe({
  canScrollToStart,
  scrollToEnd,
  layoutSettled = true,
}: {
  canScrollToStart: boolean;
  scrollToEnd: () => void;
  layoutSettled?: boolean;
}) {
  useChatScrollAdapter({ commands: { scrollToEnd }, canScrollToStart, layoutSettled });
  return null;
}

function setup(paginatedMessages = false) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `scroll-adapter-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.Embedded, paginatedMessages },
  });
  const scrollToEnd = vi.fn();
  const loadMore = vi.fn();
  service.on(AutopilotChatEvent.ConversationLoadMore, loadMore);
  const tree = (canScrollToStart: boolean, { layoutSettled = true, key = 'probe' } = {}) => (
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotStreamingProvider>
        <AutopilotLoadingProvider>
          <Probe
            key={key}
            canScrollToStart={canScrollToStart}
            scrollToEnd={scrollToEnd}
            layoutSettled={layoutSettled}
          />
        </AutopilotLoadingProvider>
      </AutopilotStreamingProvider>
    </AutopilotChatServiceProvider>
  );
  const view = render(tree(false));

  return {
    service,
    scrollToEnd,
    loadMore,
    at: (canScrollToStart: boolean, options?: { layoutSettled?: boolean; key?: string }) =>
      view.rerender(tree(canScrollToStart, options)),
  };
}

describe('useChatScrollAdapter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns to the latest message smoothly on a new turn, new chat or opened conversation', async () => {
    const { service, scrollToEnd } = setup();

    await act(async () => {
      service.sendRequest({ content: 'hi' });
    });
    act(() => service.newChat());
    act(() => service.openConversation('c1'));

    expect(scrollToEnd).toHaveBeenCalledTimes(3);
    expect(scrollToEnd).toHaveBeenNthCalledWith(1, { behavior: 'smooth' });
  });

  it('returns instantly while a reply streams', async () => {
    const { service, scrollToEnd } = setup();
    act(() =>
      service.sendResponse({ id: 'r1', content: 'a', stream: true, widget: 'x', created_at: '' })
    );

    await act(async () => {
      service.sendRequest({ content: 'hi' });
    });

    expect(scrollToEnd).toHaveBeenLastCalledWith({ behavior: 'instant' });
  });

  it('jumps instantly once a replaced conversation or a new mode has rendered', () => {
    const { service, scrollToEnd } = setup();

    act(() => service.setConversation([]));
    act(() => service.setChatMode(AutopilotChatMode.FullScreen));
    expect(scrollToEnd).not.toHaveBeenCalled();

    act(() => vi.runAllTimers());
    expect(scrollToEnd).toHaveBeenCalledTimes(1);
    expect(scrollToEnd).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('asks for older messages once per arrival at the top', () => {
    const { service, loadMore, at } = setup(true);
    const loading = vi.fn();
    service.__internalService__.on(AutopilotChatInternalEvent.SetIsLoadingMoreMessages, loading);

    at(true);
    at(false);
    at(false);
    expect(loadMore).toHaveBeenCalledTimes(1);
    expect(loading).toHaveBeenCalledWith(true);

    // Still loading: leaving and coming back does not ask again.
    at(true);
    at(false);
    expect(loadMore).toHaveBeenCalledTimes(1);

    act(() => service.prependOlderMessages([], false));
    act(() =>
      service.__internalService__.publish(
        AutopilotChatInternalEvent.SetIsLoadingMoreMessages,
        false
      )
    );
    at(true);
    at(false);
    expect(loadMore).toHaveBeenCalledTimes(2);
  });

  it('stops asking once the host says there is nothing older', () => {
    const { service, loadMore, at } = setup(true);
    act(() =>
      service.__internalService__.publish(
        AutopilotChatInternalEvent.ShouldShowLoadingMoreMessages,
        false
      )
    );

    at(true);
    at(false);

    expect(loadMore).not.toHaveBeenCalled();
  });

  it('does not ask when the conversation is not paginated', () => {
    const { loadMore, at } = setup(false);

    at(true);
    at(false);

    expect(loadMore).not.toHaveBeenCalled();
  });

  it('ignores edge changes until the layout has settled', () => {
    const { loadMore, at } = setup(true);

    // A first layout at 0px height opens "at the end", then the page fits once the viewport grows.
    at(true, { layoutSettled: false });
    at(false, { layoutSettled: false });
    at(false, { layoutSettled: true });
    expect(loadMore).not.toHaveBeenCalled();

    at(true);
    at(false);
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('does not ask again after a remount once the host has nothing older', () => {
    const { service, loadMore, at } = setup(true);
    act(() => service.prependOlderMessages([], true));
    act(() => vi.runAllTimers());

    at(true, { key: 'remounted' });
    at(false, { key: 'remounted' });

    expect(loadMore).not.toHaveBeenCalled();
  });

  it('keeps the position when older messages are prepended', () => {
    const { service, scrollToEnd } = setup(true);
    service.setConversation([
      { id: 'b', content: 'b', created_at: '', role: AutopilotChatRole.User, widget: '' },
    ]);
    act(() => vi.runAllTimers());
    scrollToEnd.mockClear();

    act(() =>
      service.prependOlderMessages([
        { id: 'a', content: 'a', created_at: '', role: AutopilotChatRole.User, widget: '' },
      ])
    );
    act(() => vi.runAllTimers());

    expect(scrollToEnd).not.toHaveBeenCalled();

    // A later replacement still jumps to the end.
    act(() => service.setConversation([]));
    act(() => vi.runAllTimers());
    expect(scrollToEnd).toHaveBeenCalledWith({ behavior: 'instant' });
  });
});
