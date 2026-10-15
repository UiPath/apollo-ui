import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { publishChatEvent } from '../headless/utils/publish-chat-event';
import { AutopilotChatEvent, AutopilotChatMode, AutopilotChatService } from '../index';
import {
  ChatPlayground,
  type ChatPlaygroundProps,
  featureArgName,
  PLAYGROUND_FEATURE_FLAGS,
} from './chat-playground';

let storyCounter = 0;
let instanceKey = '';

beforeEach(() => {
  instanceKey = `test-${++storyCounter}`;
});

const slotService = (slot: 'primary' | 'compare') =>
  AutopilotChatService.getInstance(`storybook-chat-playground-${instanceKey}-${slot}`);

const baseProps = (): ChatPlaygroundProps => ({
  ...(Object.fromEntries(
    PLAYGROUND_FEATURE_FLAGS.map((flag) => [featureArgName(flag), false])
  ) as Pick<ChatPlaygroundProps, ReturnType<typeof featureArgName>>),
  theme: 'light',
  instanceKey,
  renderer: 'wind',
  mode: AutopilotChatMode.Embedded,
  locale: 'en',
  compactMode: false,
  readOnly: false,
  disableClose: 'unset',
  title: '',
  inputPlaceholder: '',
  footerDisclaimer: '',
  firstRunExperience: false,
  customHeaderActions: false,
  preHooks: false,
  autoScroll: true,
  scenario: 'none',
  autoReply: 'off',
  streamDelayMs: 1,
});

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

describe('ChatPlayground', () => {
  it('applies args to the running chat without a new chat', async () => {
    const props = baseProps();
    const { rerender } = render(<ChatPlayground {...props} scenario="conversation" />);
    await flush();
    const service = slotService('primary');
    const root = document.querySelector('[data-slot="wind-chat"]');
    const transcript = service?.getConversation().length;

    rerender(
      <ChatPlayground {...props} scenario="conversation" compactMode title="Agent" theme="dark" />
    );
    await flush();

    expect(document.querySelector('[data-slot="wind-chat"]')).toBe(root);
    expect(root).toHaveAttribute('data-density', 'compact');
    expect(root).toHaveClass('dark');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Agent');

    // ChatRoot stops portalling when leaving Embedded, so the DOM is new but the chat is not.
    rerender(
      <ChatPlayground
        {...props}
        scenario="conversation"
        compactMode
        title="Agent"
        theme="dark"
        mode={AutopilotChatMode.FullScreen}
      />
    );
    await flush();

    expect(slotService('primary')).toBe(service);
    expect(service?.getConversation().length).toBe(transcript);
    expect(document.querySelector('[data-slot="wind-chat"]')).toHaveAttribute(
      'data-mode',
      AutopilotChatMode.FullScreen
    );
  });

  it('applies an initial autoScroll of false at mount', async () => {
    const toggle = vi.spyOn(AutopilotChatService.prototype, 'toggleAutoScroll');
    try {
      render(<ChatPlayground {...baseProps()} autoScroll={false} scenario="conversation" />);
      await flush();

      expect(toggle).toHaveBeenCalledTimes(1);
      expect(toggle).toHaveBeenCalledWith(false);
    } finally {
      toggle.mockRestore();
    }
  });

  it('clears every chat and stops the running scenario without a remount', async () => {
    render(
      <ChatPlayground {...baseProps()} renderer="both" scenario="streaming" streamDelayMs={30} />
    );
    await flush();
    const wind = slotService('primary');
    const material = slotService('compare');
    const root = document.querySelector('[data-slot="wind-chat"]');
    expect(wind?.getConversation().length).toBeGreaterThan(0);

    act(() => screen.getByRole('button', { name: 'Clear chat' }).click());
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));

    expect(wind?.getConversation()).toHaveLength(0);
    expect(material?.getConversation()).toHaveLength(0);
    expect(document.querySelector('[data-slot="wind-chat"]')).toBe(root);
  });

  it('runs the scenario cleanups on Clear chat', async () => {
    const props = baseProps();
    const { rerender } = render(<ChatPlayground {...props} scenario="loading" />);
    await flush();
    const service = slotService('primary');
    expect(service?.getLoadingMessage()).toBe('Searching the knowledge base...');

    act(() => screen.getByRole('button', { name: 'Clear chat' }).click());
    expect(service?.getLoadingMessage()).toBe('');

    rerender(<ChatPlayground {...props} scenario="long-history" />);
    await flush();
    expect(service?.getConfig().paginatedMessages).toBe(true);
    act(() => screen.getByRole('button', { name: 'Clear chat' }).click());
    expect(service?.getConfig().paginatedMessages).toBe(false);

    // The history scenario's load-more listener is gone, so no older page arrives.
    act(() => {
      if (service) publishChatEvent(service, AutopilotChatEvent.ConversationLoadMore);
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 700)));
    expect(service?.getConversation()).toHaveLength(0);
  });

  it('appends a scenario to the current transcript', async () => {
    const props = baseProps();
    const { rerender } = render(<ChatPlayground {...props} scenario="conversation" />);
    await flush();
    const service = slotService('primary');
    expect(service?.getConversation()).toHaveLength(2);

    rerender(<ChatPlayground {...props} scenario="attachments" />);
    await flush();

    expect(service?.getConversation()).toHaveLength(4);
  });

  it('mirrors a sent message to the other renderer once', async () => {
    render(<ChatPlayground {...baseProps()} renderer="both" />);
    await flush();
    const wind = slotService('primary');
    const material = slotService('compare');

    await act(async () => {
      material?.sendRequest({ content: 'hello' });
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(material?.getConversation()).toHaveLength(1);
    expect(wind?.getConversation().map((message) => message.content)).toEqual(['hello']);
  });

  it('reuses its service across remounts and starts it over', async () => {
    const first = render(<ChatPlayground {...baseProps()} scenario="conversation" />);
    await flush();
    const service = slotService('primary');
    first.unmount();

    render(<ChatPlayground {...baseProps()} scenario="none" />);
    await flush();

    expect(slotService('primary')).toBe(service);
    expect(service?.getConversation()).toHaveLength(0);
  });

  it('offers to reopen a closed chat in the selected mode', async () => {
    render(<ChatPlayground {...baseProps()} mode={AutopilotChatMode.FullScreen} />);
    await flush();
    const service = slotService('primary');

    act(() => service?.close());
    await act(async () => {
      screen.getByRole('button', { name: 'Open chat' }).click();
    });

    expect(service?.getConfig().mode).toBe(AutopilotChatMode.FullScreen);
    expect(screen.queryByRole('button', { name: 'Open chat' })).toBeNull();
  });
});
