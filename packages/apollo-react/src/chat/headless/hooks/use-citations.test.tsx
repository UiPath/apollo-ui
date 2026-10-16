import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type AutopilotChatMessage,
  AutopilotChatPreHookAction,
  AutopilotChatService,
} from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { useMessageSources, useOpenCitation } from './use-citations';

let instanceCounter = 0;

const createService = () =>
  AutopilotChatService.Instantiate({ instanceName: `citations-${++instanceCounter}` });

const wrap = (service: AutopilotChatService, children: React.ReactNode) => (
  <AutopilotChatServiceProvider chatServiceInstance={service}>
    {children}
  </AutopilotChatServiceProvider>
);

describe('useOpenCitation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks the citation-click pre-hook, then opens the citation unless it declines', async () => {
    const service = createService();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const hook = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    service.setPreHook(AutopilotChatPreHookAction.CitationClick, hook);
    let openCitation: ReturnType<typeof useOpenCitation> | undefined;
    const Probe = () => {
      openCitation = useOpenCitation();
      return null;
    };
    render(wrap(service, <Probe />));
    const pdf = { id: 2, title: 'Guide', download_url: 'https://a.test/g.pdf', page_number: 3 };

    await act(async () => openCitation?.(pdf));
    await act(async () => openCitation?.(pdf));

    expect(hook).toHaveBeenCalledWith({ citation: pdf });
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      'https://a.test/g.pdf#page=3',
      '_blank',
      'noopener,noreferrer'
    );
  });
});

describe('useOpenCitation with unsafe URLs', () => {
  afterEach(() => vi.restoreAllMocks());

  it('still asks the pre-hook with the unchanged citation but never opens a javascript: URL', async () => {
    const service = createService();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const hook = vi.fn().mockResolvedValue(true);
    service.setPreHook(AutopilotChatPreHookAction.CitationClick, hook);
    let openCitation: ReturnType<typeof useOpenCitation> | undefined;
    const Probe = () => {
      openCitation = useOpenCitation();
      return null;
    };
    render(wrap(service, <Probe />));
    const unsafe = { id: 1, title: 'Bad', url: 'javascript:alert(document.domain)' };

    await act(async () => openCitation?.(unsafe));

    expect(hook).toHaveBeenCalledWith({ citation: unsafe });
    expect(open).not.toHaveBeenCalled();
  });

  it('opens an http URL and a relative PDF at its page', async () => {
    const service = createService();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    let openCitation: ReturnType<typeof useOpenCitation> | undefined;
    const Probe = () => {
      openCitation = useOpenCitation();
      return null;
    };
    render(wrap(service, <Probe />));

    await act(async () => openCitation?.({ id: 1, title: 'Web', url: 'http://a.test/page' }));
    await act(async () =>
      openCitation?.({ id: 2, title: 'Guide', download_url: '/files/g.pdf', page_number: 4 })
    );

    expect(open.mock.calls).toEqual([
      ['http://a.test/page', '_blank', 'noopener,noreferrer'],
      ['/files/g.pdf#page=4', '_blank', 'noopener,noreferrer'],
    ]);
  });
});

describe('useMessageSources', () => {
  it('follows the group as streamed content parts add citations', () => {
    const service = createService();
    service.sendRequest({ content: 'q' });
    service.sendResponse({
      id: 's1',
      stream: true,
      widget: 'apollo-markdown-renderer',
      created_at: '',
      contentPartChunk: { index: 0, text: 'A' },
    });
    const message = service.getConversation().at(-1) as AutopilotChatMessage;
    let sources: ReturnType<typeof useMessageSources> | undefined;
    const Probe = () => {
      sources = useMessageSources(message);
      return null;
    };
    render(wrap(service, <Probe />));
    expect(sources?.sources).toEqual([]);

    act(() =>
      service.sendResponse({
        id: 's1',
        stream: true,
        done: true,
        widget: 'apollo-markdown-renderer',
        created_at: '',
        contentPartChunk: {
          index: 0,
          text: '',
          citation: { id: 1, title: 'Web', url: 'https://a.test' },
        },
      })
    );

    expect(sources?.sources).toEqual([{ id: 1, title: 'Web', url: 'https://a.test' }]);
  });

  it('waits for the rest of the group when the reply itself says more is coming', () => {
    const service = createService();
    service.sendRequest({ content: 'q' });
    const cited = {
      widget: 'apollo-markdown-renderer',
      created_at: '',
      contentParts: [{ text: 'A', citations: [{ id: 1, title: 'Web', url: 'https://a.test' }] }],
    };
    service.sendResponse({ ...cited, id: 'w1', shouldWaitForMoreMessages: true });
    const message = service.getConversation().at(-1) as AutopilotChatMessage;
    let sources: ReturnType<typeof useMessageSources> | undefined;
    const Probe = () => {
      sources = useMessageSources(message);
      return null;
    };
    render(wrap(service, <Probe />));
    expect(sources?.isWaitingForMoreMessages).toBe(true);

    act(() => service.sendResponse({ ...cited, id: 'w2' }));
    expect(sources?.isWaitingForMoreMessages).toBe(false);
  });
});
