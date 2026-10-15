import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  type AutopilotChatRenderer,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const createService = (renderer: AutopilotChatRenderer = 'wind') =>
  AutopilotChatService.Instantiate({
    instanceName: `wind-markdown-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.FullScreen, renderer },
  });

const reply = (extra: Partial<AutopilotChatMessage> & { id?: string } = {}) => ({
  widget: 'apollo-markdown-renderer',
  created_at: '',
  ...extra,
});

const CITED = reply({
  id: 'c1',
  groupId: 'g1',
  content: 'The sky is blue.',
  contentParts: [
    { text: 'The sky ' },
    {
      text: 'is blue',
      citations: [
        { id: 1, title: 'Web', url: 'https://a.test/sky' },
        { id: 2, title: 'Guide', download_url: 'https://a.test/g.pdf', page_number: 3 },
      ],
    },
    { text: '.' },
  ],
});

const messageElement = (id: string) =>
  document.querySelector(`[data-chat-message-id="${id}"]`) as HTMLElement;

afterEach(() => vi.restoreAllMocks());

describe('Wind markdown renderer', () => {
  it('renders markdown through the Markdown primitive, with images as links', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    act(() =>
      service.sendResponse(
        reply({
          id: 'm1',
          content:
            '## Title\n\n- one\n- two\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```ts\nconst a = 1;\n```\n\n![logo](https://a.test/logo.png)',
        })
      )
    );

    const message = messageElement('m1');
    expect(within(message).getByRole('heading', { level: 2 })).toHaveTextContent('Title');
    expect(within(message).getAllByRole('listitem')).toHaveLength(2);
    expect(within(message).getByRole('table')).toBeInTheDocument();
    expect(message.querySelector('[data-slot="code-block"]')).toHaveTextContent('const a = 1;');
    expect(message.querySelector('img')).toBeNull();
    expect(within(message).getByRole('link', { name: 'logo' })).toHaveAttribute(
      'href',
      'https://a.test/logo.png'
    );
  });

  it('maps resource tokens to chips, buffering one split across chunks', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);
    const now = vi.spyOn(Date, 'now');

    act(() => service.sendResponse(reply({ id: 'r1', content: 'Update ', stream: true })));
    now.mockReturnValue(1_000);
    act(() =>
      service.sendResponse(
        reply({ id: 'r1', content: '[[resource-token:{"id":"v",', stream: true })
      )
    );
    expect(messageElement('r1')).not.toHaveTextContent('resource-token');

    now.mockReturnValue(2_000);
    act(() =>
      service.sendResponse(
        reply({
          id: 'r1',
          content: '"type":"variable","icon":"mail","displayName":"email"}]] now.',
          stream: true,
          done: true,
        })
      )
    );

    const chip = messageElement('r1').querySelector('[data-slot="wind-chat-resource-chip"]');
    expect(chip).toHaveTextContent('email');
    expect(messageElement('r1')).toHaveTextContent('Update email now.');
  });

  it('shows the caret and marks the body busy only while the reply streams', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    act(() => service.sendResponse(reply({ id: 's1', content: 'Hello', stream: true })));
    const body = messageElement('s1').querySelector('[data-slot="markdown"]') as HTMLElement;
    expect(body).toHaveAttribute('aria-busy', 'true');
    expect(body.querySelector('[data-slot="markdown-cursor"]')).not.toBeNull();

    act(() => service.sendResponse(reply({ id: 's1', content: '!', stream: true, done: true })));
    expect(body).not.toHaveAttribute('aria-busy');
    expect(body.querySelector('[data-slot="markdown-cursor"]')).toBeNull();
  });

  it('offers an HTML preview only when htmlPreview is enabled, sandboxed, and not mid-stream', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);
    const html = '```html\n<h1>Hi</h1>\n```';

    act(() => service.sendResponse(reply({ id: 'h1', content: html })));
    // The service disables htmlPreview by default.
    expect(within(messageElement('h1')).queryByRole('button', { name: 'Preview' })).toBeNull();
    expect(
      within(messageElement('h1')).getByRole('button', { name: 'Expand' })
    ).toBeInTheDocument();

    act(() => service.setDisabledFeatures({ htmlPreview: false }));
    act(() => service.sendResponse(reply({ id: 'h2', content: html, stream: true })));
    expect(within(messageElement('h2')).getByRole('button', { name: 'Preview' })).toBeDisabled();

    await userEvent.click(within(messageElement('h1')).getByRole('button', { name: 'Preview' }));
    const frame = (await screen.findByRole('dialog')).querySelector('iframe') as HTMLIFrameElement;
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
    expect(frame.getAttribute('srcdoc')).toMatch(/<h1>Hi<\/h1>$/);
  });

  it('highlights the cited text while a citation is hovered', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);
    act(() => service.sendResponse(CITED));
    const message = messageElement('c1');
    const highlighted = () =>
      [...message.querySelectorAll<HTMLElement>('span')]
        .filter((span) => span.style.backgroundColor.includes('--color-background-highlight'))
        .map((span) => span.textContent);

    const citation = within(message).getByRole('button', { name: /^Citation 1: Web/ });
    await userEvent.hover(citation);
    expect(highlighted()).toEqual(['is blue']);

    await userEvent.unhover(citation);
    await waitFor(() => expect(highlighted()).toEqual([]));
  });

  it('keeps a citation with an unsafe URL a button and never opens it', async () => {
    const service = createService();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const hook = vi.fn().mockResolvedValue(true);
    service.setPreHook(AutopilotChatPreHookAction.CitationClick, hook);
    render(<ApChat chatServiceInstance={service} />);
    const unsafe = { id: 1, title: 'Bad', url: 'javascript:alert(1)' };

    act(() =>
      service.sendResponse(
        reply({ id: 'u1', groupId: 'g2', contentParts: [{ text: 'Claim', citations: [unsafe] }] })
      )
    );
    const message = messageElement('u1');
    expect(message.querySelector('a[href^="javascript"]')).toBeNull();
    await userEvent.click(within(message).getByRole('button', { name: /^Citation 1: Bad/ }));
    const sources = message.querySelector('[data-slot="wind-chat-sources"]') as HTMLElement;
    await userEvent.click(within(sources).getByRole('button', { name: /Sources/ }));
    await userEvent.click(await within(sources).findByRole('button', { name: /Bad/ }));

    await waitFor(() => expect(hook).toHaveBeenCalledTimes(2));
    expect(hook).toHaveBeenCalledWith({ citation: unsafe });
    expect(message.querySelector('a[href^="javascript"]')).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });

  it('does not highlight while the reply streams, and survives chunks with a pill active', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);
    const now = vi.spyOn(Date, 'now');
    const chunk = (text: string, extra: object = {}) =>
      service.sendResponse(
        reply({ id: 'sc', stream: true, contentPartChunk: { index: 0, text, ...extra } })
      );

    act(() => chunk('The sky', { citation: { id: 1, title: 'Web', url: 'https://a.test' } }));
    const message = messageElement('sc');
    const citation = within(message).getByRole('button', { name: /^Citation 1: Web/ });
    await userEvent.hover(citation);
    expect(message.querySelector('span[style*="--color-background-highlight"]')).toBeNull();

    now.mockReturnValue(1_000);
    act(() => chunk(' is blue'));
    now.mockReturnValue(2_000);
    act(() =>
      service.sendResponse(
        reply({ id: 'sc', stream: true, done: true, contentPartChunk: { index: 1, text: '.' } })
      )
    );
    expect(message).toHaveTextContent('The sky');
  });

  it('removes an active highlight before the reply re-renders with new content', async () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);
    act(() => service.sendResponse(CITED));
    const message = messageElement('c1');
    await userEvent.hover(within(message).getByRole('button', { name: /^Citation 1: Web/ }));
    expect(message.querySelector('span[style*="--color-background-highlight"]')).not.toBeNull();

    act(() =>
      service.sendResponse({
        ...CITED,
        contentParts: [
          { text: 'The sea ' },
          { text: 'is blue too', citations: [{ id: 1, title: 'Web', url: 'https://a.test/sea' }] },
        ],
      })
    );

    expect(message).toHaveTextContent('The sea is blue too');
    expect(message.querySelector('span[style*="--color-background-highlight"]')).toBeNull();
  });

  it('drops an open preview for the code when htmlPreview is turned off', async () => {
    const service = createService();
    service.setDisabledFeatures({ htmlPreview: false });
    render(<ApChat chatServiceInstance={service} />);
    act(() => service.sendResponse(reply({ id: 'h3', content: '```html\n<h1>Hi</h1>\n```' })));

    await userEvent.click(within(messageElement('h3')).getByRole('button', { name: 'Preview' }));
    const dialog = await screen.findByRole('dialog');
    const frame = dialog.querySelector('iframe') as HTMLIFrameElement;
    expect(frame.getAttribute('srcdoc')).toMatch(
      /^<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none';[^"]*"><h1>Hi<\/h1>$/
    );

    act(() => service.setDisabledFeatures({ htmlPreview: true }));

    expect(dialog.querySelector('iframe')).toBeNull();
    expect(dialog.querySelector('[data-slot="code-block"]')).toHaveTextContent('<h1>Hi</h1>');
  });

  it('lists the sources under the reply and opens one through the pre-hook', async () => {
    const service = createService();
    const hook = vi.fn().mockResolvedValue(false);
    service.setPreHook(AutopilotChatPreHookAction.CitationClick, hook);
    render(<ApChat chatServiceInstance={service} />);

    act(() => service.sendResponse(CITED));
    const sources = messageElement('c1').querySelector(
      '[data-slot="wind-chat-sources"]'
    ) as HTMLElement;
    await userEvent.click(within(sources).getByRole('button', { name: /Sources/ }));
    await userEvent.click(await within(sources).findByRole('button', { name: /Guide/ }));

    await waitFor(() =>
      expect(hook).toHaveBeenCalledWith({
        citation: { id: 2, title: 'Guide', download_url: 'https://a.test/g.pdf', page_number: 3 },
      })
    );
  });
});

describe('citation parity', () => {
  async function clickCitation(renderer: AutopilotChatRenderer) {
    const service = createService(renderer);
    const hook = vi.fn().mockResolvedValue(false);
    service.setPreHook(AutopilotChatPreHookAction.CitationClick, hook);
    const { unmount } = render(<ApChat chatServiceInstance={service} />);
    act(() => service.sendResponse(CITED));

    const citation = await screen.findByRole(
      'button',
      { name: /^Citation 2: Guide/ },
      { timeout: 25_000 }
    );
    await userEvent.click(citation);
    await waitFor(() => expect(hook).toHaveBeenCalledTimes(1));
    unmount();

    return hook.mock.calls[0]?.[0];
  }

  it('gives the citation-click pre-hook the same payload from Wind and Material', async () => {
    const material = await clickCitation('material');
    const wind = await clickCitation('wind');

    expect(wind).toEqual(material);
    expect(wind).toEqual({
      citation: { id: 2, title: 'Guide', download_url: 'https://a.test/g.pdf', page_number: 3 },
    });
  }, 40_000);

  it('never opens an unsafe citation URL from Material either, but still asks the pre-hook', async () => {
    const service = createService('material');
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const hook = vi.fn().mockResolvedValue(true);
    service.setPreHook(AutopilotChatPreHookAction.CitationClick, hook);
    render(<ApChat chatServiceInstance={service} />);
    const unsafe = { id: 1, title: 'Bad', url: 'javascript:alert(1)' };
    act(() =>
      service.sendResponse(
        reply({ id: 'mu', groupId: 'g3', contentParts: [{ text: 'Claim', citations: [unsafe] }] })
      )
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /^Citation 1: Bad/ }, { timeout: 25_000 })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sources' }));
    await userEvent.click(await screen.findByText('[1] Bad'));

    await waitFor(() => expect(hook).toHaveBeenCalledTimes(2));
    expect(hook).toHaveBeenNthCalledWith(1, { citation: unsafe });
    expect(hook).toHaveBeenNthCalledWith(2, { citation: unsafe });
    expect(open).not.toHaveBeenCalled();
  }, 40_000);
});
