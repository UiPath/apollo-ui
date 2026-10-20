import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  AutopilotChatEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  type AutopilotChatRenderer,
  AutopilotChatRole,
  AutopilotChatService,
  CHAT_WIDTH_KEY,
  CHAT_WIDTH_SIDE_BY_SIDE_MIN,
  StorageService,
} from '../index';

let instanceCounter = 0;
const LABEL = 'Overdue invoices';
const RENDERERS = ['wind', 'material'] as const;

const shown = () => screen.queryAllByText(LABEL).length > 0;
const settle = (ms = 50) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
const message = (id: string, role: AutopilotChatRole) =>
  ({
    id,
    role,
    content: id,
    created_at: '',
    widget: 'apollo-markdown-renderer',
  }) as AutopilotChatMessage;

function createService(renderer: AutopilotChatRenderer, embeddedContainer?: HTMLElement) {
  return AutopilotChatService.Instantiate({
    instanceName: `chat-state-${++instanceCounter}`,
    config: {
      mode: embeddedContainer ? AutopilotChatMode.Embedded : AutopilotChatMode.FullScreen,
      embeddedContainer,
      renderer,
      disabledFeatures: { history: false, settings: false },
    },
  });
}

// A turn and its reply, then suggestions for that turn, as a host sets them.
function converse(service: AutopilotChatService, sendOnClick?: boolean) {
  act(() => service.sendRequest({ content: 'Which invoices are ready?' }));
  act(() =>
    service.sendResponse({
      id: 'r1',
      content: 'Two are.',
      created_at: '',
      widget: 'apollo-markdown-renderer',
    })
  );
  act(() => service.setSuggestions([{ label: LABEL, prompt: 'Which are overdue?' }], sendOnClick));
}

const ready = () => screen.findByRole('button', { name: /Attach file/ }, { timeout: 25_000 });

// Each renderer's panel-wide drop target.
function dropDraft(renderer: AutopilotChatRenderer) {
  const target = (
    renderer === 'wind'
      ? document.querySelector('[data-slot="wind-chat-dropzone"]')
      : document.querySelector('input[type="file"][style*="display: none"]')?.parentElement
  ) as HTMLElement;
  const file = new File(['abc'], 'draft.txt', { type: 'text/plain' });
  fireEvent.drop(target, {
    dataTransfer: {
      types: ['Files'],
      files: [file],
      items: [
        { kind: 'file', type: file.type, getAsFile: () => file, getAsString: () => undefined },
      ],
    },
  });
}

describe.each(RENDERERS)('%s chat state across modes', (renderer) => {
  it('keeps suggestions and the draft from Embedded to FullScreen and back', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const service = createService(renderer, container);
    render(<ApChat chatServiceInstance={service} />);
    await ready();
    converse(service);
    dropDraft(renderer);
    await waitFor(() => expect(screen.getAllByText('draft.txt').length).toBeGreaterThan(0));

    act(() => service.setChatMode(AutopilotChatMode.FullScreen));
    await ready();
    expect(container).not.toHaveTextContent('Two are.');
    expect(shown()).toBe(true);
    expect(screen.getAllByText('draft.txt').length).toBeGreaterThan(0);

    act(() => service.setChatMode(AutopilotChatMode.Embedded));
    await ready();
    expect(container).toHaveTextContent('Two are.');
    expect(shown()).toBe(true);
    expect(screen.getAllByText('draft.txt').length).toBeGreaterThan(0);
    container.remove();
  }, 60_000);

  it('keeps suggestions and the draft when an embedded chat is closed and reopened', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const service = createService(renderer, container);
    render(<ApChat chatServiceInstance={service} />);
    await ready();
    converse(service);
    dropDraft(renderer);
    await waitFor(() => expect(screen.getAllByText('draft.txt').length).toBeGreaterThan(0));

    act(() => service.setChatMode(AutopilotChatMode.Closed));
    await settle(400);
    if (renderer === 'wind') {
      // Wind still unmounts its tree once the exit animation ends, as before.
      expect(document.querySelector('[data-slot="wind-chat"]')).toBeNull();
    } else {
      // Material stays mounted and hidden, now inside the container.
      expect(container).toHaveTextContent('Two are.');
    }

    act(() => service.setChatMode(AutopilotChatMode.Embedded));
    await ready();
    expect(container).toHaveTextContent('Two are.');
    expect(shown()).toBe(true);
    expect(screen.getAllByText('draft.txt').length).toBeGreaterThan(0);
    container.remove();
  }, 60_000);

  it('reopens in FullScreen after the host removed the container while closed', async () => {
    const errors = vi.spyOn(console, 'error');
    const container = document.createElement('div');
    document.body.append(container);
    const service = createService(renderer, container);
    render(<ApChat chatServiceInstance={service} />);
    await ready();
    converse(service);

    act(() => service.setChatMode(AutopilotChatMode.Closed));
    await settle(400);
    // The renderer is detached with it.
    container.remove();
    act(() => service.setChatMode(AutopilotChatMode.FullScreen));
    await ready();

    expect(document.body.contains(screen.getByRole('button', { name: /Attach file/ }))).toBe(true);
    expect(shown()).toBe(true);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  }, 60_000);

  it('reopens in Embedded after the container was removed and added back while closed', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const service = createService(renderer, container);
    render(<ApChat chatServiceInstance={service} />);
    await ready();
    converse(service);

    act(() => service.setChatMode(AutopilotChatMode.Closed));
    await settle(400);
    container.remove();
    document.body.append(container);
    act(() => service.setChatMode(AutopilotChatMode.Embedded));
    await ready();

    expect(container).toHaveTextContent('Two are.');
    expect(shown()).toBe(true);
    container.remove();
  }, 60_000);

  it('opens SideBySide at the saved width, not the width of the embedded container', async () => {
    StorageService.Instance.remove(CHAT_WIDTH_KEY);
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 1234, configurable: true });
    document.body.append(container);
    const service = createService(renderer, container);
    render(<ApChat chatServiceInstance={service} />);
    await ready();

    act(() => service.setChatMode(AutopilotChatMode.SideBySide));
    await settle(100);

    if (renderer === 'wind') {
      const root = document.querySelector('[data-slot="wind-chat"]') as HTMLElement;
      expect(root.style.getPropertyValue('--chat-width')).toBe(`${CHAT_WIDTH_SIDE_BY_SIDE_MIN}px`);
    } else {
      const widths = [...document.body.querySelectorAll('div')].map(
        (element) => getComputedStyle(element).width
      );
      expect(widths).toContain(`${CHAT_WIDTH_SIDE_BY_SIDE_MIN}px`);
      expect(widths).not.toContain('1234px');
    }
    container.remove();
  }, 60_000);
});

describe.each(RENDERERS)('%s suggestions lifecycle', (renderer) => {
  async function setup() {
    const service = createService(renderer);
    const view = render(<ApChat chatServiceInstance={service} />);
    await ready();
    converse(service);
    expect(shown()).toBe(true);
    return { service, view };
  }

  it.each<[string, (service: AutopilotChatService) => void]>([
    [
      'opening and closing settings',
      (service) => {
        service.toggleSettings(true);
        service.toggleSettings(false);
      },
    ],
    [
      'opening and closing history',
      (service) => {
        service.toggleHistory(true);
        service.toggleHistory(false);
      },
    ],
    ['a theme change', (service) => service.setTheme('dark')],
    [
      'a mode change without an embedded container',
      (service) => {
        service.setChatMode(AutopilotChatMode.Embedded);
        service.setChatMode(AutopilotChatMode.FullScreen);
      },
    ],
    [
      'another reply to the same turn',
      (service) =>
        service.sendResponse({
          id: 'r2',
          content: 'More.',
          created_at: '',
          widget: 'apollo-markdown-renderer',
        }),
    ],
    [
      'setting the same conversation',
      (service) => service.setConversation([...service.getConversation()]),
    ],
    [
      'older messages prepended',
      (service) =>
        service.prependOlderMessages([
          message('u0', AutopilotChatRole.User),
          message('a0', AutopilotChatRole.Assistant),
        ]),
    ],
  ])(
    'keeps them through %s',
    async (_name, run) => {
      const { service } = await setup();
      act(() => run(service));
      await settle();
      expect(shown()).toBe(true);
    },
    60_000
  );

  it.each<[string, (service: AutopilotChatService) => void]>([
    ['a request', (service) => service.sendRequest({ content: 'Next' })],
    [
      'a new chat',
      (service) => {
        service.newChat();
        service.setConversation([
          message('u9', AutopilotChatRole.User),
          message('a9', AutopilotChatRole.Assistant),
        ]);
      },
    ],
    [
      'opening another conversation',
      (service) => {
        service.openConversation('c2');
        service.setConversation([
          message('u9', AutopilotChatRole.User),
          message('a9', AutopilotChatRole.Assistant),
        ]);
      },
    ],
    ['the host setting an empty list', (service) => service.setSuggestions([])],
  ])(
    'clears them on %s',
    async (_name, run) => {
      const { service } = await setup();
      act(() => run(service));
      await settle();
      expect(shown()).toBe(false);
      expect(service.getSuggestions()).toEqual([]);
    },
    60_000
  );

  it('shows them, sendOnClick included, in a chat mounted after they were set and after the host remounts it', async () => {
    const service = createService(renderer);
    const requests: string[] = [];
    service.on(AutopilotChatEvent.Request, (request: AutopilotChatMessage) =>
      requests.push(request.content)
    );
    converse(service, true);
    const first = render(<ApChat chatServiceInstance={service} />);
    await ready();
    await waitFor(() => expect(shown()).toBe(true));

    first.unmount();
    render(<ApChat chatServiceInstance={service} />);
    await ready();
    await waitFor(() => expect(shown()).toBe(true));

    // sendOnClick came through the remount: picking one sends it.
    act(() => screen.getAllByText(LABEL)[0]?.click());
    await waitFor(() => expect(requests).toContain('Which are overdue?'));
  }, 60_000);
});
