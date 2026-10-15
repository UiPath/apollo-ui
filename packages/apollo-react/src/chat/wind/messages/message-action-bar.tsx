import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  MessageActionCopy,
  MessageActionFeedback,
  type MessageActionItem,
  MessageActions,
} from '@uipath/apollo-wind';

import { useIsStreamingMessage } from '../../headless/hooks/use-is-streaming-message';
import {
  MESSAGE_ACTION_BAD,
  MESSAGE_ACTION_COPY,
  MESSAGE_ACTION_GOOD,
  useDefaultMessageActions,
  useMessageActionHandler,
} from '../../headless/hooks/use-message-actions';
import type { AutopilotChatMessage, AutopilotChatMessageAction } from '../../service';
import { ServiceIcon } from '../common/service-icon';

/**
 * Copy, feedback and the message's own `actions` (those marked `showInOverflow` go in the "More"
 * menu). Unlike Material, a rating can be switched after it is given; it cannot be cleared.
 * Always shown on the latest reply, on hover or focus elsewhere, and hidden while the message
 * streams.
 */
export function MessageActionBar({
  message,
  isLatestReply,
  copyText,
}: {
  message: AutopilotChatMessage;
  isLatestReply: boolean;
  /** The group's copy text, as the Copy event handler builds it. */
  copyText: string;
}) {
  const { _ } = useLingui();
  // A rating can be changed in Wind; each change publishes Feedback with the new value.
  const defaults = useDefaultMessageActions(message, { allowRatingChange: true });
  const runAction = useMessageActionHandler(message);
  const { isStreaming } = useIsStreamingMessage(message);

  if (isStreaming) {
    return null;
  }

  const copy = defaults.find((action) => action.name === MESSAGE_ACTION_COPY);
  const good = defaults.find((action) => action.name === MESSAGE_ACTION_GOOD);
  const bad = defaults.find((action) => action.name === MESSAGE_ACTION_BAD);
  const custom = message.actions ?? [];
  const inBar = custom.filter((action) => !action.showInOverflow);
  const inMenu = custom.filter((action) => action.showInOverflow);
  const toItem = (action: AutopilotChatMessageAction): MessageActionItem => ({
    id: action.name,
    label: action.label,
    icon: <ServiceIcon icon={action.icon} />,
    disabled: action.disabled,
    onSelect: () => runAction(action),
  });

  if (!copy && !good && !bad && custom.length === 0) {
    return null;
  }

  return (
    <MessageActions
      visibility={isLatestReply ? 'always' : 'hover'}
      actions={[...inBar, ...inMenu].map(toItem)}
      maxVisible={inBar.length}
      // In flow under the content, on the content's edge, for requests and responses alike. Its
      // 28px (4px gap plus the 24px bar) is given back with a negative margin and taken from the
      // group's trailing margin instead, so revealing it on hover never moves other messages.
      className="mt-1 -mb-7 px-0"
      strings={{
        label: _(msg({ id: 'autopilot-chat.message.actions.label', message: `Message actions` })),
        more: _(msg({ id: 'autopilot-chat.message.actions.more', message: `More actions` })),
      }}
    >
      {copy && (
        <MessageActionCopy
          data-testid={`autopilot-chat-message-action-${MESSAGE_ACTION_COPY}`}
          // The primitive writes too, for its "Copied" tick; the Copy event's handler writes the
          // same text for Material parity, so Wind accepts two identical writes.
          text={copyText}
          onClick={() => runAction(copy)}
          strings={{
            copy: copy.label,
            copied: _(msg({ id: 'autopilot-chat.message.actions.copied', message: `Copied` })),
          }}
        />
      )}
      {(good || bad) && (
        <MessageActionFeedback
          value={message.feedback ? (message.feedback.isPositive ? 'up' : 'down') : null}
          onChange={(rating) => {
            const action = rating === 'up' ? good : bad;
            if (action) {
              runAction(action);
            }
          }}
          strings={{
            label: _(
              msg({ id: 'autopilot-chat.message.actions.feedback', message: `Rate this response` })
            ),
            helpful: good?.label ?? '',
            notHelpful: bad?.label ?? '',
          }}
        />
      )}
    </MessageActions>
  );
}
