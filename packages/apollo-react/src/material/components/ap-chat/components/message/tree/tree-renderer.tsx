import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';
import { ApTreeView, type ApTreeViewItem } from '../../../../ap-tree-view';
import type { ApolloChatTreeRendererProps, ToolData, TreeSpanNode } from './tree-renderer.types';

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
  ): ApTreeViewItem | null => {
    const spanData = spanNode?.data;
    if (!spanData) {
      return null;
    }

    let children: ApTreeViewItem[] | undefined;
    if (Array.isArray(spanNode?.children) && spanNode.children.length > 0) {
      children = spanNode.children
        .map((child: TreeSpanNode, index: number) =>
          (customTransformSpanToTreeItem || defaultTransformSpanToTreeItem)(
            child,
            `${key}-${index}`
          )
        )
        .filter((item: ApTreeViewItem | null): item is ApTreeViewItem => item !== null);
    }

    const getAdditionalInfo = (data: ToolData): string | undefined => {
      if (data.additionalInfo) {
        return data.additionalInfo;
      }
      return undefined;
    };

    const item: ApTreeViewItem = {
      id: spanData.id ?? key,
      title: spanNode.name ?? _(msg({ id: 'autopilot-chat.tree.unknown', message: `Unknown` })),
      description:
        spanData.attributes?.description ??
        spanData.attributes?.type ??
        _(msg({ id: 'autopilot-chat.tree.no-description', message: `No description` })),
      icon: spanData.icon,
      expanded: spanData.expanded,
      titleColor: spanData.titleColor,
      customIcon: spanData.customIcon,
      additionalInfo: getAdditionalInfo(spanData),
      children,
    } as ApTreeViewItem;

    return item;
  };

  // Use custom callback if provided, otherwise use default
  const transformSpanToTreeItem = customTransformSpanToTreeItem || defaultTransformSpanToTreeItem;

  const treeItems = transformToTreeItems(span);
  const getExpandedItems = (items: ApTreeViewItem[]): string[] => {
    const ids: string[] = [];
    const traverse = (item: ApTreeViewItem) => {
      if (item.expanded !== false) {
        ids.push(item.id);
      }
      if (item.children) {
        item.children.forEach(traverse);
      }
    };
    items.forEach(traverse);
    return ids;
  };

  const expandedItems = getExpandedItems(treeItems);

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
