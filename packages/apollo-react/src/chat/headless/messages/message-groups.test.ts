import { describe, expect, it } from 'vitest';

import { type AutopilotChatMessage, AutopilotChatRole } from '../../service';
import { getMessageCopyText, groupChatMessages, withoutFakeStream } from './message-groups';

const message = (id: string, extra: Partial<AutopilotChatMessage> = {}): AutopilotChatMessage => ({
  id,
  content: id,
  created_at: '',
  role: AutopilotChatRole.Assistant,
  widget: 'apollo-markdown-renderer',
  ...extra,
});

describe('groupChatMessages', () => {
  it('groups consecutive messages that share a groupId and keeps the rest alone', () => {
    const groups = groupChatMessages([
      message('u1', { role: AutopilotChatRole.User, groupId: 'g1' }),
      message('a1', { groupId: 'g1' }),
      message('a2', { groupId: 'g1' }),
      message('a3'),
      message('a4'),
      message('a5', { groupId: 'g1' }),
    ]);

    expect(groups.map((group) => group.map(({ id }) => id))).toEqual([
      ['u1', 'a1', 'a2'],
      ['a3'],
      ['a4'],
      ['a5'],
    ]);
  });

  it('does not group consecutive messages of the same role without a groupId', () => {
    expect(groupChatMessages([message('a1'), message('a2')])).toHaveLength(2);
  });
});

describe('getMessageCopyText', () => {
  it('joins the group, prefers toCopy and strips resource tokens', () => {
    const token = '[[resource-token:{"id":"v","type":"variable","displayName":"email"}]]';
    const group = [message('a1', { content: `Update ${token}` }), message('a2', { toCopy: 'two' })];

    expect(getMessageCopyText(group, message('a2'))).toBe('Update email\ntwo');
  });

  it('copies the message itself when it has no group', () => {
    expect(getMessageCopyText([], message('a1', { toCopy: 'only this' }))).toBe('only this');
  });
});

describe('withoutFakeStream', () => {
  it('drops fakeStream so restored messages render complete', () => {
    expect(withoutFakeStream([message('a1', { fakeStream: true })])[0]).not.toHaveProperty(
      'fakeStream'
    );
  });
});
