import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatService,
} from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotChatStateProvider, useChatState } from '../providers/chat-state-provider';
import { useConversationSuggestions, useSuggestionSelect } from './use-suggestions';

let instanceCounter = 0;
let select: ReturnType<typeof useSuggestionSelect> | undefined;
let conversation: ReturnType<typeof useConversationSuggestions> | undefined;
let state: ReturnType<typeof useChatState> | undefined;
let shown: AutopilotChatMessage[] | undefined;

function Probe() {
  select = useSuggestionSelect();
  conversation = useConversationSuggestions(shown);
  state = useChatState();
  return null;
}

function setup(config: Partial<AutopilotChatConfiguration> = {}) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `suggestions-${++instanceCounter}`,
    config,
  });
  const view = render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotChatStateProvider>
        <Probe />
      </AutopilotChatStateProvider>
    </AutopilotChatServiceProvider>
  );
  const rerender = () =>
    view.rerender(
      <AutopilotChatServiceProvider chatServiceInstance={service}>
        <AutopilotChatStateProvider>
          <Probe />
        </AutopilotChatStateProvider>
      </AutopilotChatServiceProvider>
    );
  return { service, rerender };
}

const reply = (id: string) => ({
  id,
  content: id,
  widget: 'apollo-markdown-renderer',
  created_at: '',
});
const suggestion = { label: 'Overdue', prompt: 'Which are overdue?' };

describe('useSuggestionSelect', () => {
  it('sends with sendOnClick, else fills the composer, and focuses it either way', async () => {
    const { service } = setup();
    const events: string[] = [];
    service.on(AutopilotChatEvent.Request, () => events.push('request'));
    service.on(AutopilotChatEvent.SetPrompt, (prompt) => events.push(`prompt:${prompt}`));
    service.__internalService__.on(AutopilotChatInternalEvent.SetInputFocused, () =>
      events.push('focus')
    );

    act(() => select?.(suggestion, false));
    expect(events).toEqual(['prompt:Which are overdue?', 'focus']);

    events.length = 0;
    act(() => select?.(suggestion, true));
    await act(async () => {});
    expect(events).toContain('request');
    expect(events).toContain('focus');
    expect(service.getConversation().at(-1)?.content).toBe('Which are overdue?');
  });
});

describe('conversation suggestions', () => {
  it('belong to the user turn they were set in, replies included', async () => {
    const { service, rerender } = setup();
    // As a host would: set from its own Request handler, before the reply arrives.
    service.on(AutopilotChatEvent.Request, () => service.setSuggestions([suggestion]));
    await act(async () => service.sendRequest({ content: 'q1' }));
    act(() => service.sendResponse(reply('r1')));
    shown = service.getConversation();
    rerender();
    expect(conversation?.attached).toBe(true);

    act(() => service.sendResponse(reply('r2')));
    shown = service.getConversation();
    rerender();
    expect(conversation?.attached).toBe(true);

    // A later user turn the service did not clear them for (restored conversation) leaves them.
    act(() => service.setConversation([...service.getConversation()]));
    shown = [...service.getConversation(), { ...reply('u2'), role: 'user' } as never];
    rerender();
    expect(conversation?.attached).toBe(false);
  });

  it('fall back to the first-run sendOnClick, as Material does', () => {
    const { service } = setup({
      firstRunExperience: { title: 'Hi', description: '', sendOnClick: true },
    });

    act(() => service.setSuggestions([suggestion]));
    expect(conversation?.sendOnClick).toBe(true);

    act(() => service.setSuggestions([suggestion], false));
    expect(conversation?.sendOnClick).toBe(false);
  });

  it('are cleared by the service on a request, and by the provider on a new chat', () => {
    const { service } = setup();
    act(() => service.setSuggestions([suggestion]));
    act(() => service.sendRequest({ content: 'next' }));
    expect(conversation?.suggestions).toEqual([]);

    act(() => service.setSuggestions([suggestion]));
    act(() => service.newChat());
    act(() => service.setConversation([reply('restored') as never]));
    expect(conversation?.suggestions).toEqual([]);
  });
});

describe('firstRunVisible', () => {
  it('shows a first run with content while the conversation is empty', () => {
    const { service } = setup({ firstRunExperience: { title: 'Welcome', description: '' } });
    expect(state?.firstRunVisible).toBe(true);

    act(() => state?.setHasMessages(true));
    expect(state?.firstRunVisible).toBe(false);

    act(() => {
      state?.setHasMessages(false);
      service.setFirstRunExperience({ title: '', description: '' });
    });
    expect(state?.firstRunVisible).toBe(false);
  });
});
