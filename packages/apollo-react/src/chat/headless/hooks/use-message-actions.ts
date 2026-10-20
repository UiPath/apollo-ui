import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';

import {
  type AutopilotChatActionPayload,
  AutopilotChatEvent,
  type AutopilotChatMessage,
  type AutopilotChatMessageAction,
  AutopilotChatPreHookAction,
  AutopilotChatRole,
} from '../../service';
import { useChatService } from '../providers/chat-service.provider';
import { useChatState } from '../providers/chat-state-provider';
import { publishChatEvent } from '../utils/publish-chat-event';

export const MESSAGE_ACTION_COPY = 'autopilot-chat-copy';
export const MESSAGE_ACTION_GOOD = 'autopilot-chat-good';
export const MESSAGE_ACTION_BAD = 'autopilot-chat-bad';

export interface DefaultMessageActionsOptions {
  /**
   * Keep both thumbs actionable after a rating so it can be changed, each change publishing
   * `Feedback` again. Off, a rating is final: only the chosen thumb remains, disabled (Material).
   */
  allowRatingChange?: boolean;
}

/**
 * The built-in actions of a message: copy on every message, and thumbs up and down on assistant
 * messages.
 */
export function useDefaultMessageActions(
  message: AutopilotChatMessage,
  { allowRatingChange = false }: DefaultMessageActionsOptions = {}
) {
  const { _ } = useLingui();
  const { disabledFeatures, readOnly } = useChatState();

  return React.useMemo(() => {
    const actions: AutopilotChatMessageAction[] = [];

    if (!disabledFeatures.copy) {
      actions.push({
        name: MESSAGE_ACTION_COPY,
        label: _(msg({ id: 'autopilot-chat.message.actions.copy', message: `Copy` })),
        icon: 'content_copy',
        eventName: AutopilotChatEvent.Copy,
      });
    }

    if (message.role !== AutopilotChatRole.Assistant || readOnly || disabledFeatures.feedback) {
      return actions;
    }

    const good = _(msg({ id: 'autopilot-chat.message.actions.good', message: `Good response` }));
    const bad = _(msg({ id: 'autopilot-chat.message.actions.bad', message: `Bad response` }));

    if (message.feedback && !allowRatingChange) {
      const { isPositive } = message.feedback;

      return [
        ...actions,
        {
          name: isPositive ? MESSAGE_ACTION_GOOD : MESSAGE_ACTION_BAD,
          label: isPositive ? good : bad,
          icon: isPositive ? 'thumb_up' : 'thumb_down',
          disabled: true,
        },
      ];
    }

    return [
      ...actions,
      {
        name: MESSAGE_ACTION_GOOD,
        label: good,
        icon: 'thumb_up',
        eventName: AutopilotChatEvent.Feedback,
        details: { isPositive: true, preHookAction: AutopilotChatPreHookAction.Feedback },
      },
      {
        name: MESSAGE_ACTION_BAD,
        label: bad,
        icon: 'thumb_down',
        eventName: AutopilotChatEvent.Feedback,
        details: { isPositive: false, preHookAction: AutopilotChatPreHookAction.Feedback },
      },
    ];
  }, [message, readOnly, disabledFeatures.feedback, disabledFeatures.copy, allowRatingChange, _]);
}

/**
 * Whether `message` belongs to the latest assistant reply, whose actions stay visible: it is that
 * message, or shares its `groupId`. Messages without a `groupId` only match themselves. For
 * renderers that track it per message; a list can derive it from what it renders instead.
 */
export function useIsLastAssistantMessage(message: AutopilotChatMessage) {
  const chatService = useChatService();
  const [isLast, setIsLast] = React.useState(false);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const sameReply = (candidate: AutopilotChatMessage | undefined) =>
      !!candidate &&
      (candidate.id === message.id || (!!message.groupId && candidate.groupId === message.groupId));
    // From the transcript, not the event payload: feedback re-sends an older reply as a Response,
    // which is not the latest one.
    const update = () => {
      const assistantMessages = chatService
        .getConversation?.()
        ?.filter((candidate) => candidate.role === AutopilotChatRole.Assistant);
      setIsLast(sameReply(assistantMessages?.[assistantMessages.length - 1]));
    };

    update();

    return chatService.on(AutopilotChatEvent.Response, update);
  }, [chatService, message]);

  return isLast;
}

/**
 * Runs a message action: its pre-hook first, when it has one, then its event with the message and
 * its group as payload.
 */
export function useMessageActionHandler(message: AutopilotChatMessage) {
  const chatService = useChatService();

  return React.useCallback(
    async (action: AutopilotChatMessageAction) => {
      if (!action.eventName || !chatService) {
        return;
      }

      const group = chatService.getMessagesInGroup(message.groupId ?? '');
      const currentMessage = chatService
        .getConversation()
        .find((candidate) => candidate.id === message.id) as AutopilotChatMessage;

      if (action.details?.preHookAction) {
        const proceed = await chatService.getPreHook(
          action.details.preHookAction as AutopilotChatPreHookAction
        )({
          isPositive: action.details.isPositive,
          group,
          message: currentMessage,
        });

        if (!proceed) {
          return;
        }
      }

      publishChatEvent(chatService, action.eventName, {
        group,
        message: currentMessage,
        action,
      } satisfies AutopilotChatActionPayload);
    },
    [message, chatService]
  );
}
