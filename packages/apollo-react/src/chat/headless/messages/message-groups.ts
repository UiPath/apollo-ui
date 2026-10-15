import type { AutopilotChatMessage } from '../../service';
import { stripResourceTokens } from '../markdown/resource-token-parser';

/**
 * Splits a transcript into groups: consecutive messages sharing a `groupId` form one group, and a
 * message without one is a group of its own. Renderers show actions and sources only on the last
 * message of a group.
 */
export function groupChatMessages(messages: readonly AutopilotChatMessage[]) {
  return messages.reduce<AutopilotChatMessage[][]>((groups, message, index) => {
    const previous = messages[index - 1];

    if (message.groupId && previous?.groupId === message.groupId) {
      groups[groups.length - 1]?.push(message);
    } else {
      groups.push([message]);
    }

    return groups;
  }, []);
}

/**
 * Drops `fakeStream` so a restored transcript renders complete instead of replaying its streams.
 */
export function withoutFakeStream(messages: readonly AutopilotChatMessage[]) {
  return messages.map(({ fakeStream: _fakeStream, ...rest }) => rest);
}

/**
 * What the copy action puts on the clipboard: the whole group, or the message when it has none,
 * preferring `toCopy`, with resource tokens reduced to their labels.
 */
export function getMessageCopyText(
  group: readonly AutopilotChatMessage[],
  message: AutopilotChatMessage
) {
  const text =
    group.length === 0
      ? (message.toCopy ?? message.content)
      : group.map((member) => member.toCopy ?? member.content).join('\n');

  return stripResourceTokens(text);
}
