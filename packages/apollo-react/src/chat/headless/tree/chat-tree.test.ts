import { describe, expect, it } from 'vitest';

import { getExpandedTreeIds, toChatTreeItem } from './chat-tree';

const strings = { unknown: 'Unknown' };

describe('chat tree', () => {
  it('builds rows as Material does, without a placeholder description', () => {
    const item = toChatTreeItem(
      {
        key: 'r',
        name: 'Root',
        data: { id: 'root', attributes: { type: 'agentRun' }, additionalInfo: '2s', icon: 'bot' },
        children: [
          { key: 'c', name: 'Child', data: { attributes: { description: 'Looks things up' } } },
          { key: 'q', name: 'Quiet child', data: {} },
          { key: 'n', name: 'No data', data: undefined as never },
        ],
      },
      'root',
      strings
    );

    expect(item).toEqual({
      id: 'root',
      title: 'Root',
      description: 'agentRun',
      icon: 'bot',
      expanded: undefined,
      titleColor: undefined,
      customIcon: undefined,
      additionalInfo: '2s',
      children: [
        {
          id: 'root-0',
          title: 'Child',
          description: 'Looks things up',
          icon: undefined,
          expanded: undefined,
          titleColor: undefined,
          customIcon: undefined,
          additionalInfo: undefined,
          children: undefined,
        },
        {
          id: 'root-1',
          title: 'Quiet child',
          description: undefined,
          icon: undefined,
          expanded: undefined,
          titleColor: undefined,
          customIcon: undefined,
          additionalInfo: undefined,
          children: undefined,
        },
      ],
    });
  });

  it('opens every row unless its span says expanded: false', () => {
    expect(
      getExpandedTreeIds([
        {
          id: 'a',
          title: 'A',
          children: [{ id: 'b', title: 'B', expanded: false }],
        },
      ])
    ).toEqual(['a']);
  });
});
