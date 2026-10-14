import { render } from '@testing-library/react';
import { AutopilotChatMode } from '@uipath/apollo-react/chat/service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const scroll = vi.hoisted(() => ({
  setOverflowContainer: () => {},
  contentRef: { current: null },
  overflowContainer: null as HTMLElement | null,
  isOverflow: true,
  isContainerWide: false,
}));

vi.mock('@uipath/apollo-react/chat/headless/providers/chat-scroll-provider', () => ({
  useChatScroll: () => scroll,
}));
vi.mock('@uipath/apollo-react/chat/headless/providers/chat-state-provider', () => ({
  useChatState: () => ({ disabledFeatures: {}, theming: undefined, hasMessages: false }),
}));
vi.mock('./chat-message', () => ({ AutopilotChatMessages: () => null }));
vi.mock('./chat-scroll-to-bottom', () => ({ AutopilotChatScrollToBottomButton: () => null }));

const { ChatScrollContainer } = await import('./chat-scroll-container');

const containerWith = (offsetWidth: number, clientWidth: number) => {
  const element = document.createElement('div');
  Object.defineProperty(element, 'offsetWidth', { value: offsetWidth });
  Object.defineProperty(element, 'clientWidth', { value: clientWidth });
  return element;
};

const paddingRight = () =>
  getComputedStyle(document.getElementById('overflow-container') as HTMLElement).paddingRight;

describe('ChatScrollContainer', () => {
  beforeEach(() => {
    scroll.isOverflow = true;
  });

  it('keeps its padding when an overlay scrollbar takes no width', () => {
    scroll.overflowContainer = containerWith(400, 400);
    render(<ChatScrollContainer mode={AutopilotChatMode.Embedded} />);

    expect(paddingRight()).toBe('24px');
  });

  it('narrows its padding for a scrollbar that takes width', () => {
    scroll.overflowContainer = containerWith(400, 385);
    render(<ChatScrollContainer mode={AutopilotChatMode.Embedded} />);

    expect(paddingRight()).toBe('8px');
  });
});
