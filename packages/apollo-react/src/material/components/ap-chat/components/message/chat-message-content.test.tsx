import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it } from 'vitest';

import { ApI18nProvider } from '../../../../../i18n';
import { AutopilotChatServiceProvider } from '../../providers/chat-service.provider';
import { AutopilotChatStateProvider } from '../../providers/chat-state-provider';
import { LocaleProvider } from '../../providers/locale-provider';
import {
  AGENTS_TOOL_CALL_RENDERER,
  type AutopilotChatMessage,
  AutopilotChatRole,
  AutopilotChatService,
} from '../../service';
import { AutopilotChatMessageContent } from './chat-message-content';

const START_TIME = '2026-01-01T00:00:00.000Z';
const END_TIME = '2026-01-01T00:00:02.000Z';

const chatService = AutopilotChatService.Instantiate({
  instanceName: 'chat-message-content-test',
});

const toolCallMessage = (meta: Record<string, unknown> = {}): AutopilotChatMessage => ({
  id: 'tool-call-1',
  groupId: 'group-1',
  content: "Performing 'get_weather'",
  created_at: START_TIME,
  role: AutopilotChatRole.Assistant,
  widget: AGENTS_TOOL_CALL_RENDERER,
  meta: {
    toolName: 'get_weather',
    input: { city: 'Bucharest' },
    startTime: START_TIME,
    ...meta,
  },
});

const tree = (message: AutopilotChatMessage, isLastInGroup: boolean): React.ReactElement => (
  <AutopilotChatServiceProvider chatServiceInstance={chatService}>
    <LocaleProvider>
      <ApI18nProvider component="material/components/ap-chat">
        <AutopilotChatStateProvider>
          <AutopilotChatMessageContent
            message={message}
            isLastInGroup={isLastInGroup}
            disableActions
            containerRef={null}
          />
        </AutopilotChatStateProvider>
      </ApI18nProvider>
    </LocaleProvider>
  </AutopilotChatServiceProvider>
);

// Re-query rather than hold a reference: a remount replaces the node.
const toolCallHeader = () => screen.getByRole('button', { name: /get weather/i });

describe('<AutopilotChatMessageContent> tool call renderer', () => {
  it('stays expanded when the streamed reply lands after it in the same group', async () => {
    const user = userEvent.setup();
    const message = toolCallMessage();
    const { rerender } = render(tree(message, true));

    await user.click(toolCallHeader());
    expect(toolCallHeader()).toHaveAttribute('aria-expanded', 'true');

    // The streamed reply shares this group, so the tool call stops being last.
    rerender(tree(message, false));

    expect(toolCallHeader()).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays expanded when the tool result replaces the message', async () => {
    const user = userEvent.setup();
    const { rerender } = render(tree(toolCallMessage(), false));

    await user.click(toolCallHeader());
    expect(toolCallHeader()).toHaveAttribute('aria-expanded', 'true');

    // A finished tool call is re-sent under the same id, as a new message object.
    rerender(
      tree(toolCallMessage({ output: { tempC: 21 }, endTime: END_TIME, isError: false }), false)
    );

    expect(toolCallHeader()).toHaveAttribute('aria-expanded', 'true');
  });
});
