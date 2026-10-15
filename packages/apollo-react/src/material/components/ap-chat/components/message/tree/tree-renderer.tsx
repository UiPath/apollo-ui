import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  type ChatTreeItem,
  type ChatTreeSpanNode,
  getExpandedTreeIds,
  toChatTreeItem,
} from '@uipath/apollo-react/chat/headless/tree/chat-tree';
import {
  ApTreeView,
  type ApTreeViewItem,
} from '@uipath/apollo-react/material/components/ap-tree-view';
import React from 'react';
import type { ApolloChatTreeRendererProps, TreeSpanNode } from './tree-renderer.types';

export const ApolloChatTreeRenderer: React.FC<ApolloChatTreeRendererProps> = ({
  span,
  onItemSelect,
  transformSpanToTreeItem: customTransformSpanToTreeItem,
  transformToTreeItems: customTransformToTreeItems,
}) => {
  const { _ } = useLingui();

  const defaultTransformToTreeItems = (): ApTreeViewItem[] => {
    const items: ApTreeViewItem[] = [];

    if (span) {
      const rootItem = transformSpanToTreeItem(span, 'root');
      if (rootItem) {
        items.push(rootItem);
      }
    }

    return items;
  };

  const transformToTreeItems = customTransformToTreeItems || defaultTransformToTreeItems;
  const defaultTransformSpanToTreeItem = (
    spanNode: TreeSpanNode,
    key: string
  ): ApTreeViewItem | null =>
    toChatTreeItem(
      spanNode as unknown as ChatTreeSpanNode,
      key,
      { unknown: _(msg({ id: 'autopilot-chat.tree.unknown', message: `Unknown` })) },
      (child, childKey) =>
        (customTransformSpanToTreeItem || defaultTransformSpanToTreeItem)(
          child as unknown as TreeSpanNode,
          childKey
        ) as ChatTreeItem | null
    ) as ApTreeViewItem | null;

  // Use custom callback if provided, otherwise use default
  const transformSpanToTreeItem = customTransformSpanToTreeItem || defaultTransformSpanToTreeItem;

  const treeItems = transformToTreeItems(span);
  const expandedItems = getExpandedTreeIds(treeItems as ChatTreeItem[]);

  // Callback handlers
  const handleItemSelect = React.useCallback(
    (itemId: string | undefined) => {
      if (itemId && onItemSelect) {
        const findItemById = (items: ApTreeViewItem[], id: string): ApTreeViewItem | null => {
          for (const item of items) {
            if (item.id === id) {
              return item;
            }
            if (item.children) {
              const found = findItemById(item.children, id);
              if (found) {
                return found;
              }
            }
          }
          return null;
        };

        const selectedItem = findItemById(treeItems, itemId);
        if (selectedItem) {
          onItemSelect(itemId, selectedItem);
        }
      }
    },
    [onItemSelect, treeItems]
  );

  if (!treeItems || treeItems.length === 0) {
    return (
      <div className="apollo-chat-tree-renderer">
        {_(msg({ id: 'autopilot-chat.tree.no-items', message: `No items` }))}
      </div>
    );
  }

  return (
    <div className="apollo-chat-tree-renderer">
      <ApTreeView
        items={treeItems}
        expanded={expandedItems}
        disableExpandCollapse={false}
        showSelectedChevron={true}
        useApIcon={true}
        onSelectedItemsChange={handleItemSelect}
      />
    </div>
  );
};
