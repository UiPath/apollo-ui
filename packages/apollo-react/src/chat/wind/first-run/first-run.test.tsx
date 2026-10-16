import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type AutopilotChatConfiguration,
  AutopilotChatInterceptableEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  type AutopilotChatRenderer,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const FIRST_RUN = {
  title: 'Welcome to Autopilot',
  description: 'Ask about your automations.',
  suggestions: [
    { label: 'New process', prompt: 'How do I create a new process?' },
    { label: 'Debug workflow', prompt: 'How do I debug a workflow?' },
  ],
};

function setup(
  config: Partial<AutopilotChatConfiguration> = {},
  renderer: AutopilotChatRenderer = 'wind'
) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-first-run-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      renderer,
      firstRunExperience: FIRST_RUN,
      ...config,
    },
  });
  const requests: AutopilotChatMessage[] = [];
  service.intercept(AutopilotChatInterceptableEvent.Request, (message: AutopilotChatMessage) => {
    requests.push(message);
  });
  const view = render(<ApChat chatServiceInstance={service} />);
  return { service, requests, view };
}

const hero = () => document.querySelector('[data-slot="chat-hero"]') as HTMLElement;
const textbox = () => screen.getByRole('textbox', { name: 'Message' });
const reply = (content: string) => ({
  content,
  widget: 'apollo-markdown-renderer',
  created_at: '',
});

describe('Wind first-run experience', () => {
  it('centers the hero with the composer inside it in FullScreen', () => {
    setup();

    expect(hero()).toHaveAttribute('data-layout', 'centered');
    expect(hero()).toHaveAttribute('data-first-run');
    expect(
      within(hero()).getByRole('heading', { name: 'Welcome to Autopilot' })
    ).toBeInTheDocument();
    expect(hero()).toHaveTextContent('Ask about your automations.');
    expect(hero().contains(textbox())).toBe(true);
    const suggestions = within(hero()).getByRole('group', { name: 'Suggestions' });
    expect(suggestions).toHaveAttribute('data-orientation', 'horizontal');
    // Under the welcome text and above the composer.
    expect(
      suggestions.compareDocumentPosition(textbox()) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('never shows beside a conversation set before it mounts', () => {
    const service = AutopilotChatService.Instantiate({
      instanceName: `wind-first-run-${++instanceCounter}`,
      config: {
        mode: AutopilotChatMode.FullScreen,
        renderer: 'wind',
        firstRunExperience: FIRST_RUN,
      },
    });
    service.setConversation([{ ...reply('Earlier answer'), id: 'e1', role: 'assistant' } as never]);
    const seen: boolean[] = [];
    const observer = new MutationObserver(() =>
      seen.push(!!document.querySelector('[data-first-run]'))
    );
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });

    render(<ApChat chatServiceInstance={service} />);
    observer.disconnect();

    expect(seen).not.toContain(true);
    expect(document.querySelector('[data-first-run]')).toBeNull();
  });

  it('shows the skeleton, not the hero, while a conversation loads into an empty chat', () => {
    const { service } = setup();

    act(() => service.openConversation('c1', true));

    expect(document.querySelector('[data-first-run]')).toBeNull();
    expect(document.querySelector('[data-slot="wind-chat-messages-skeleton"]')).not.toBeNull();
  });

  it('docks above the composer in Embedded', () => {
    const embeddedContainer = document.createElement('div');
    document.body.appendChild(embeddedContainer);
    setup({ mode: AutopilotChatMode.Embedded, embeddedContainer });

    expect(hero()).toHaveAttribute('data-layout', 'docked');
    expect(hero().contains(textbox())).toBe(false);
    expect(within(hero()).getByRole('group', { name: 'Suggestions' })).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
    embeddedContainer.remove();
  });

  it('gives way to the transcript on the first message, keeping the composer and its draft', async () => {
    const { service } = setup();
    await userEvent.type(textbox(), 'my draft');
    const field = textbox();

    // A reply from the host, say a greeting; a request would clear the prompt in any renderer.
    act(() => service.sendResponse(reply('Hello from the host')));

    expect(hero()).not.toHaveAttribute('data-first-run');
    expect(screen.queryByRole('heading', { name: 'Welcome to Autopilot' })).toBeNull();
    expect(screen.getByRole('log')).toHaveTextContent('Hello from the host');
    // The same element, so it was not remounted, still holding the draft and focus.
    expect(textbox()).toBe(field);
    expect(field).toHaveValue('my draft');
    expect(field).toHaveFocus();
  });

  it('fills the composer from a suggestion, or sends it with sendOnClick', async () => {
    const { requests } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'New process' }));
    expect(textbox()).toHaveValue('How do I create a new process?');
    expect(textbox()).toHaveFocus();
    expect(requests).toHaveLength(0);
  });

  it('sends a first-run suggestion with sendOnClick', async () => {
    const { requests } = setup({ firstRunExperience: { ...FIRST_RUN, sendOnClick: true } });

    await userEvent.click(screen.getByRole('button', { name: 'Debug workflow' }));

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.content).toBe('How do I debug a workflow?');
  });
});

describe('Wind conversation suggestions', () => {
  it('show under the reply when the host sets them as the request arrives', async () => {
    const { service } = setup({ firstRunExperience: undefined });
    // As a host would, for this one turn: set from its Request handler, before the reply.
    const unsubscribe = service.on('request', () => {
      unsubscribe();
      service.setSuggestions([{ label: 'Overdue', prompt: 'Which are overdue?' }]);
    });
    await act(async () => service.sendRequest({ content: 'Which invoices came in?' }));
    act(() => service.sendResponse({ ...reply('Twelve'), id: 's1', stream: true }));
    act(() => service.sendResponse({ ...reply(' invoices.'), id: 's1', stream: true, done: true }));

    const group = screen.getByRole('group', { name: 'Suggestions' });
    expect(group.closest('[data-slot="wind-chat-message-group"]')).toHaveTextContent(
      'Twelve invoices.'
    );
    await userEvent.click(within(group).getByRole('button', { name: 'Overdue' }));
    expect(textbox()).toHaveValue('Which are overdue?');

    // The next user turn leaves them behind.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Suggestions' })).toBeNull());
  });

  it('send with sendOnClick and are cleared by the request', async () => {
    const { service, requests } = setup({ firstRunExperience: undefined });
    act(() => service.sendResponse(reply('Twelve invoices.')));
    act(() => service.setSuggestions([{ label: 'Overdue', prompt: 'Which are overdue?' }], true));

    await userEvent.click(screen.getByRole('button', { name: 'Overdue' }));

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.content).toBe('Which are overdue?');
    expect(screen.queryByRole('group', { name: 'Suggestions' })).toBeNull();
  });
});

describe('Wind thinking state', () => {
  afterEach(() => vi.useRealTimers());

  it('rotates the loading messages, takes a set one, and hides at the first token', async () => {
    const { service } = setup({ firstRunExperience: undefined });
    act(() => service.setDefaultLoadingMessages(['Thinking...', 'Reading...'], 3000));

    await act(async () => service.sendRequest({ content: 'Question' }));
    const thinking = () => document.querySelector('[data-slot="wind-chat-thinking"]');
    expect(thinking()).toHaveTextContent('Thinking...');

    vi.useFakeTimers();
    act(() => vi.advanceTimersByTime(3000));
    expect(thinking()).toHaveTextContent('Reading...');
    vi.useRealTimers();

    act(() => service.setLoadingMessage('Searching the knowledge base...'));
    expect(thinking()).toHaveTextContent('Searching the knowledge base...');

    act(() => service.sendResponse({ ...reply('First'), stream: true }));
    expect(thinking()).toBeNull();
  });
});

describe('first run with the thinking state', () => {
  it('shows the thinking row in the hero while a reply is awaited on an empty chat', () => {
    const { service } = setup();

    act(() => service.setShowLoading(true));

    expect(
      document.querySelector('[data-first-run] [data-slot="wind-chat-thinking"]')
    ).not.toBeNull();
  });
});

describe('first-run suggestion parity', () => {
  async function pick(renderer: AutopilotChatRenderer) {
    const { requests, view } = setup(
      { firstRunExperience: { ...FIRST_RUN, sendOnClick: true } },
      renderer
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'New process' }, { timeout: 25_000 })
    );
    await waitFor(() => expect(requests).toHaveLength(1));
    view.unmount();
    const { id: _id, created_at: _created, ...payload } = requests[0] as AutopilotChatMessage;
    return payload;
  }

  it('sends the same Request from Wind and Material', async () => {
    const material = await pick('material');
    const wind = await pick('wind');

    expect(wind).toEqual(material);
  }, 40_000);
});
