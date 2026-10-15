import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  type AutopilotChatRenderer,
  AutopilotChatRole,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const createService = (renderer: AutopilotChatRenderer = 'wind') =>
  AutopilotChatService.Instantiate({
    instanceName: `wind-message-list-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.FullScreen, renderer },
  });

const reply = (extra: Partial<AutopilotChatMessage> & { id?: string } = {}) => ({
  widget: 'apollo-markdown-renderer',
  created_at: '',
  ...extra,
});

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const groups = () => [...document.querySelectorAll('[data-slot="wind-chat-message-group"]')];

describe('Wind message list', () => {
  it('renders one scroller item per group, anchoring user turns', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    await act(async () => {
      service.sendRequest({ content: 'Question' });
    });
    act(() => {
      service.sendResponse(reply({ content: 'Part one' }));
      service.sendResponse(reply({ content: 'Part two' }));
    });

    // The user turn is a group of its own; the replies to it share the turn's groupId.
    expect(groups()).toHaveLength(2);
    expect(groups()[0]).toHaveAttribute('data-scroll-anchor', 'true');
    expect(groups()[0]).toHaveAttribute('data-message-id', service.getConversation()[0]?.id);
    expect(groups()[1]).toHaveAttribute('data-scroll-anchor', 'false');
    expect(groups()[1]?.querySelectorAll('[data-chat-message-id]')).toHaveLength(2);
    expect(screen.getByRole('log')).toHaveTextContent('QuestionPart onePart two');
  });

  it('puts the user turn in a bubble and the reply in plain prose', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    await act(async () => {
      service.sendRequest({ content: 'Question' });
    });
    act(() => service.sendResponse(reply({ content: 'Answer' })));

    const user = document.querySelector(`[data-role="${AutopilotChatRole.User}"]`) as HTMLElement;
    const assistant = document.querySelector(
      `[data-role="${AutopilotChatRole.Assistant}"]`
    ) as HTMLElement;
    expect(user.querySelector('[data-slot="bubble"]')).not.toBeNull();
    expect(assistant.querySelector('[data-slot="bubble"]')).toBeNull();
  });

  it('shows sent files by name, with the type as an icon only', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    await act(async () => {
      service.sendRequest({
        content: 'Files',
        attachments: [
          { name: 'brief.docx', type: 'application/msword', size: 1 },
          { name: 'deck.pptx', type: 'application/vnd.ms-powerpoint', size: 2 },
        ],
      });
    });

    const files = document.querySelector(
      '[data-slot="wind-chat-message-attachments"]'
    ) as HTMLElement;
    expect(files.textContent).toBe('brief.docxdeck.pptx');
    expect(files.querySelectorAll('svg')).toHaveLength(2);
  });

  it('shows a message of files alone as its attachment row, without an empty bubble', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    await act(async () => {
      service.sendRequest({
        content: '',
        attachments: [{ name: 'brief.docx', type: 'application/msword', size: 1 }],
      });
    });
    await act(async () => {
      service.sendRequest({
        content: 'With text',
        attachments: [{ name: 'deck.pptx', type: 'application/vnd.ms-powerpoint', size: 2 }],
      });
    });

    const [filesOnly, withText] = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-role="${AutopilotChatRole.User}"]`)
    );
    expect(filesOnly?.querySelector('[data-slot="wind-chat-message-attachments"]')).not.toBeNull();
    expect(filesOnly?.querySelector('[data-slot="bubble"]')).toBeNull();
    expect(withText?.querySelector('[data-slot="bubble"]')).toHaveTextContent('With text');
  });

  it('follows a streamed reply in the built-in text renderer', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    act(() => service.sendResponse(reply({ id: 's1', content: 'Hel', stream: true })));
    act(() => service.sendResponse(reply({ id: 's1', content: 'lo', stream: true })));

    expect(screen.getByRole('log')).toHaveTextContent('Hello');
  });

  it('renders injected component renderers inline', () => {
    const service = createService();
    service.injectMessageRenderer({
      name: 'custom-card',
      component: ({ message }) => <div data-testid="custom-card">{message.content}</div>,
    });
    render(<ApChat chatServiceInstance={service} />);

    act(() => service.sendResponse(reply({ content: 'From a component', widget: 'custom-card' })));

    expect(screen.getByTestId('custom-card')).toHaveTextContent('From a component');
  });

  it('gives injected render() renderers a DOM slot and cleans up', () => {
    const service = createService();
    const cleanup = vi.fn();
    const renderInto = vi.fn((container: HTMLElement, message: AutopilotChatMessage) => {
      container.textContent = `rendered ${message.content}`;
      return cleanup;
    });
    service.injectMessageRenderer({ name: 'dom-card', render: renderInto });
    const { unmount } = render(<ApChat chatServiceInstance={service} />);

    act(() => service.sendResponse(reply({ id: 'd1', content: 'one', widget: 'dom-card' })));
    const slot = document.querySelector('[data-slot="wind-chat-injected-message"]');
    expect(slot).toHaveTextContent('rendered one');
    expect(renderInto).toHaveBeenCalledTimes(1);

    act(() => service.sendResponse(reply({ id: 'd1', content: 'two', widget: 'dom-card' })));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(renderInto).toHaveBeenCalledTimes(2);

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('announces each settled reply once', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);
    const region = document.querySelector('[data-slot="live-region"]') as HTMLElement;

    act(() => service.sendResponse(reply({ id: 's1', content: 'a', stream: true })));
    expect(region).toHaveTextContent('');

    act(() => service.sendResponse(reply({ id: 's1', content: '', stream: true, done: true })));
    await waitFor(() => expect(region).toHaveTextContent('New response'));
  });

  it('shows the thinking row while waiting, older-message dots and the initial skeleton', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    await act(async () => {
      service.sendRequest({ content: 'hi' });
    });
    expect(document.querySelector('[data-slot="wind-chat-thinking"]')).not.toBeNull();

    act(() =>
      service.__internalService__.publish(AutopilotChatInternalEvent.SetIsLoadingMoreMessages, true)
    );
    expect(document.querySelector('[data-slot="loading-dots"]')).not.toBeNull();

    act(() =>
      service.__internalService__.publish(AutopilotChatInternalEvent.ShowLoadingState, true)
    );
    expect(document.querySelector('[data-slot="wind-chat-messages-skeleton"]')).not.toBeNull();
  });

  it('hides actions while streaming and keeps them off a lone message with disableActions', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    act(() => service.sendResponse(reply({ id: 's1', content: 'a', stream: true })));
    expect(document.querySelector('[data-slot="message-actions"]')).toBeNull();

    act(() => service.sendResponse(reply({ id: 's1', content: '', stream: true, done: true })));
    expect(document.querySelector('[data-slot="message-actions"]')).not.toBeNull();

    act(() => service.sendResponse(reply({ id: 'n1', content: 'quiet', disableActions: true })));
    const quiet = document.querySelector('[data-chat-message-id="n1"]') as HTMLElement;
    expect(quiet.querySelector('[data-slot="message-actions"]')).toBeNull();
  });

  it('publishes copy and feedback, reflects the rating with aria-pressed and lets it change', async () => {
    const service = createService();
    const events: Array<[string, unknown]> = [];
    service.on(AutopilotChatEvent.Copy, (payload) => events.push(['copy', payload]));
    service.on(AutopilotChatEvent.Feedback, (payload) => events.push(['feedback', payload]));
    render(<ApChat chatServiceInstance={service} />);
    act(() => service.sendResponse(reply({ id: 'r1', content: 'Answer' })));
    const message = document.querySelector('[data-chat-message-id="r1"]') as HTMLElement;

    await userEvent.click(within(message).getByRole('button', { name: 'Copy' }));
    // The primitive writes for its tick and the shared Copy handler writes the same text.
    expect(await within(message).findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(writeText.mock.calls).toEqual([['Answer'], ['Answer']]);

    const good = within(message).getByRole('button', { name: 'Love this' });
    expect(good).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(good);

    expect(events.map(([name]) => name)).toEqual(['copy', 'feedback']);
    expect(events[1]?.[1]).toMatchObject({
      message: { id: 'r1' },
      action: { name: 'autopilot-chat-good', details: { isPositive: true } },
    });
    await waitFor(() =>
      expect(
        within(document.querySelector('[data-chat-message-id="r1"]') as HTMLElement).getByRole(
          'button',
          { name: 'Love this' }
        )
      ).toHaveAttribute('aria-pressed', 'true')
    );
    expect(service.getConversation()[0]?.feedback).toEqual({ isPositive: true });

    // The rating can be changed; each change publishes Feedback with the new value.
    const current = () => document.querySelector('[data-chat-message-id="r1"]') as HTMLElement;
    await userEvent.click(within(current()).getByRole('button', { name: 'Needs improvement' }));

    await waitFor(() => expect(events).toHaveLength(3));
    expect(events[2]?.[1]).toMatchObject({
      action: { name: 'autopilot-chat-bad', details: { isPositive: false } },
    });
    await waitFor(() =>
      expect(within(current()).getByRole('button', { name: 'Needs improvement' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
    expect(within(current()).getByRole('button', { name: 'Love this' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(service.getConversation()[0]?.feedback).toEqual({ isPositive: false });
  });
});

describe('message actions parity', () => {
  async function rate(renderer: AutopilotChatRenderer) {
    const service = createService(renderer);
    const published: unknown[] = [];
    service.on(AutopilotChatEvent.Feedback, (payload) => published.push(payload));
    const { unmount } = render(<ApChat chatServiceInstance={service} />);
    act(() => service.sendResponse(reply({ id: 'p1', content: 'Answer', groupId: 'g' })));

    const good = await screen.findByRole('button', { name: 'Love this' }, { timeout: 25_000 });
    await userEvent.click(good);
    await waitFor(() => expect(published).toHaveLength(1));
    unmount();

    return published[0] as { message: { id: string }; group: unknown[]; action: unknown };
  }

  it('publishes the same feedback payload from Wind and Material', async () => {
    const material = await rate('material');
    const wind = await rate('wind');

    expect(wind.action).toEqual(material.action);
    expect(wind.message.id).toBe(material.message.id);
    expect(wind.group).toHaveLength(material.group.length);
  }, 40_000);
});

describe('message action visibility', () => {
  const bar = (id: string) =>
    document.querySelector(
      `[data-chat-message-id="${id}"] [data-slot="message-actions"]`
    ) as HTMLElement;

  it('always shows the latest reply and reveals the others on hover or focus within', () => {
    const service = createService();
    service.setConversation(
      ['a1', 'a2', 'a3'].map((id) => ({
        id,
        content: id,
        created_at: '',
        role: AutopilotChatRole.Assistant,
        widget: 'apollo-markdown-renderer',
      }))
    );
    render(<ApChat chatServiceInstance={service} />);

    expect(bar('a3')).toHaveAttribute('data-visibility', 'always');
    for (const id of ['a1', 'a2']) {
      expect(bar(id)).toHaveAttribute('data-visibility', 'hover');
      // Hidden until its group is hovered or holds focus: the classes key on the group wrapper.
      expect(bar(id).className).toContain('opacity-0');
      expect(bar(id).className).toContain('group-hover/message:opacity-100');
      expect(bar(id).className).toContain('group-focus-within/message:opacity-100');
      expect(bar(id).closest('.group\\/message')).not.toBeNull();
    }
  });

  it('moves "latest" to a new reply and hides the bar while it streams', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    act(() => service.sendResponse(reply({ id: 'r1', content: 'first', groupId: 'g1' })));
    expect(bar('r1')).toHaveAttribute('data-visibility', 'always');

    act(() =>
      service.sendResponse(reply({ id: 'r2', content: 'second', groupId: 'g2', stream: true }))
    );
    expect(bar('r1')).toHaveAttribute('data-visibility', 'hover');
    expect(bar('r2')).toBeNull();

    act(() => service.sendResponse(reply({ id: 'r2', content: '', stream: true, done: true })));
    expect(bar('r2')).toHaveAttribute('data-visibility', 'always');
  });

  it('keeps the latest reply visible when an older reply is rated', async () => {
    const service = createService();
    service.setConversation(
      ['a1', 'a2', 'a3'].map((id) => ({
        id,
        content: id,
        created_at: '',
        role: AutopilotChatRole.Assistant,
        widget: 'apollo-markdown-renderer',
      }))
    );
    render(<ApChat chatServiceInstance={service} />);

    await userEvent.click(
      within(document.querySelector('[data-chat-message-id="a1"]') as HTMLElement).getByRole(
        'button',
        { name: 'Love this' }
      )
    );
    await waitFor(() =>
      expect(service.getConversation()[0]?.feedback).toEqual({ isPositive: true })
    );

    expect(bar('a3')).toHaveAttribute('data-visibility', 'always');
    expect(bar('a1')).toHaveAttribute('data-visibility', 'hover');
  });
});

describe('custom message actions', () => {
  it('dispatches bar actions, skips one whose pre-hook declines, and moves overflow ones to More', async () => {
    const service = AutopilotChatService.Instantiate({
      instanceName: `wind-custom-actions-${++instanceCounter}`,
      config: {
        mode: AutopilotChatMode.FullScreen,
        renderer: 'wind',
        preHooks: { feedback: () => Promise.resolve(false) },
      },
    });
    const published: string[] = [];
    for (const name of ['regenerate', 'archive', 'guarded']) {
      service.on(name as AutopilotChatEvent, () => published.push(name));
    }
    render(<ApChat chatServiceInstance={service} />);
    act(() =>
      service.sendResponse(
        reply({
          id: 'c1',
          content: 'With actions',
          actions: [
            {
              name: 'regenerate',
              label: 'Regenerate',
              icon: 'refresh-cw',
              eventName: 'regenerate',
            },
            {
              name: 'guarded',
              label: 'Guarded',
              eventName: 'guarded',
              details: { preHookAction: AutopilotChatPreHookAction.Feedback },
            },
            { name: 'archive', label: 'Archive', eventName: 'archive', showInOverflow: true },
          ],
        })
      )
    );
    const message = document.querySelector('[data-chat-message-id="c1"]') as HTMLElement;

    await userEvent.click(within(message).getByRole('button', { name: 'Regenerate' }));
    await userEvent.click(within(message).getByRole('button', { name: 'Guarded' }));
    expect(within(message).queryByRole('button', { name: 'Archive' })).toBeNull();

    // Opening the menu is checked in Storybook: under this package's tests apollo-wind's built
    // overflow trigger does not get its Radix trigger props, so only its presence is checked.
    expect(within(message).getByRole('button', { name: 'More actions' })).toBeInTheDocument();

    await waitFor(() => expect(published).toEqual(['regenerate']));
  });
});
