import { act, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  APOLLO_CHAT_TREE_RENDERER,
  ApChat,
  AutopilotChatMode,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const START_TIME = '2026-01-01T00:00:00.000Z';

function setup() {
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-tree-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.FullScreen, renderer: 'wind' },
  });
  render(<ApChat chatServiceInstance={service} />);
  return service;
}

const messageElement = (id: string) =>
  document.querySelector(`[data-chat-message-id="${id}"]`) as HTMLElement;

describe('Wind tree renderer', () => {
  it('renders the span tree open, except rows that say expanded: false', async () => {
    const service = setup();
    act(() =>
      service.sendResponse({
        id: 'tree',
        content: 'Trace',
        widget: APOLLO_CHAT_TREE_RENDERER,
        created_at: START_TIME,
        meta: {
          span: {
            key: 'root',
            name: 'Root',
            data: { id: 'root', additionalInfo: '3s' },
            children: [
              {
                key: 'a',
                name: 'Open child',
                data: { id: 'a' },
                children: [{ key: 'a1', name: 'Grandchild', data: { id: 'a1' } }],
              },
              {
                key: 'b',
                name: 'Closed child',
                data: { id: 'b', expanded: false },
                children: [{ key: 'b1', name: 'Hidden', data: { id: 'b1' } }],
              },
            ],
          },
        },
      })
    );

    const tree = messageElement('tree').querySelector(
      '[data-slot="wind-chat-tree"]'
    ) as HTMLElement;
    expect(tree).toHaveTextContent('Root');
    expect(tree).toHaveTextContent('3s');
    expect(tree).toHaveTextContent('Grandchild');
    expect(tree).not.toHaveTextContent('Hidden');

    expect(within(tree).getByRole('tree', { name: 'Details' })).toBeInTheDocument();
    const closed = within(tree).getByRole('treeitem', { name: 'Closed child' });
    expect(closed).toHaveAttribute('aria-expanded', 'false');
    expect(within(tree).getByRole('treeitem', { name: 'Open child' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await userEvent.click(closed.querySelector('[data-slot="disclosure-tree-row"]') as HTMLElement);
    expect(tree).toHaveTextContent('Hidden');
    expect(closed).toHaveAttribute('aria-expanded', 'true');
  });

  it('never shows a placeholder description', () => {
    const service = setup();
    act(() =>
      service.sendResponse({
        id: 'tree2',
        content: 'Trace',
        widget: APOLLO_CHAT_TREE_RENDERER,
        created_at: START_TIME,
        meta: {
          span: {
            key: 'root',
            name: 'Described',
            data: { id: 'root', attributes: { description: 'Merges the results' } },
            children: [{ key: 'q', name: 'Quiet', data: { id: 'q' } }],
          },
        },
      })
    );

    // The tooltips themselves are checked in Storybook; the description is also the row's
    // accessible description.
    const tree = within(messageElement('tree2'));
    expect(tree.getByRole('treeitem', { name: 'Described' })).toHaveAccessibleDescription(
      'Merges the results'
    );
    expect(tree.getByRole('treeitem', { name: 'Quiet' })).not.toHaveAttribute('aria-describedby');
    expect(messageElement('tree2')).not.toHaveTextContent('No description');
  });
});
