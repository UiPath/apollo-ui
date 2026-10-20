import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { DisclosureTree, type DisclosureTreeItem } from '@uipath/apollo-wind';
import React from 'react';

import {
  type ChatTreeItem,
  type ChatTreeSpanNode,
  getExpandedTreeIds,
  toChatTreeItem,
} from '../../headless/tree/chat-tree';
import type { AutopilotChatMessage } from '../../service';
import { ServiceIcon } from '../common/service-icon';

function toDisclosureItems(
  items: readonly ChatTreeItem[],
  expanded: ReadonlySet<string>
): DisclosureTreeItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.titleColor ? (
      <span style={{ color: item.titleColor }}>{item.title}</span>
    ) : (
      item.title
    ),
    icon: item.icon ? <ServiceIcon icon={item.icon} /> : undefined,
    description: item.description,
    trailing: item.additionalInfo,
    defaultExpanded: expanded.has(item.id),
    children: item.children?.length ? toDisclosureItems(item.children, expanded) : undefined,
  }));
}

/**
 * A tree message (`APOLLO_CHAT_TREE_RENDERER`): the span in `meta.span` as nested rows, built
 * as Material's tree renderer builds them, open unless a span says `expanded: false`.
 */
function TreeMessageRendererComponent({ message }: { message: AutopilotChatMessage }) {
  const { _ } = useLingui();
  const span = message.meta?.span as ChatTreeSpanNode | undefined;

  const items = React.useMemo(() => {
    if (!span) {
      return [];
    }
    const root = toChatTreeItem(span, 'root', {
      unknown: _(msg({ id: 'autopilot-chat.tree.unknown', message: `Unknown` })),
    });
    return root ? toDisclosureItems([root], new Set(getExpandedTreeIds([root]))) : [];
  }, [span, _]);

  if (!span) {
    return null;
  }

  if (items.length === 0) {
    return (
      <p data-slot="wind-chat-tree" className="text-muted-foreground">
        {_(msg({ id: 'autopilot-chat.tree.no-items', message: `No items` }))}
      </p>
    );
  }

  return (
    // The tool call's type and colour, so its rows read like a trace inside a tool call.
    <div
      data-slot="wind-chat-tree"
      className="min-w-0 text-sm text-muted-foreground in-data-[density=compact]:text-xs"
    >
      <DisclosureTree
        items={items}
        aria-label={_(msg({ id: 'autopilot-chat.tree.label', message: `Details` }))}
      />
    </div>
  );
}

export const TreeMessageRenderer = React.memo(TreeMessageRendererComponent);
