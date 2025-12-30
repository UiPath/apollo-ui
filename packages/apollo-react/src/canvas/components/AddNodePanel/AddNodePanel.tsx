import { useCallback, useMemo } from 'react';
import { useOptionalNodeTypeRegistry } from '../BaseNode';
import { Toolbox } from '../Toolbox';
import type { ListItem } from '../Toolbox/ListView';
import type { AddNodePanelProps } from './AddNodePanel.types';

export function AddNodePanel({
  onNodeSelect,
  onClose,
  onSearch,
  onNodeHover,
  items,
  title,
  loading,
}: AddNodePanelProps) {
  const registry = useOptionalNodeTypeRegistry();

  const nodeListOptions = useMemo((): ListItem[] => {
    if (items) return items;
    if (!registry) return [];
    return registry
      .getCategoryConfig()
      .map((category) => {
        const nodes = registry.getNodeOptions(category.id);
        if (!nodes.length) return null;
        const categoryListItem = category;
        categoryListItem.children = nodes;
        return categoryListItem;
      })
      .filter((item) => item !== null);
  }, [items, registry]);

  const handleSearch = useCallback(
    (
      query: string,
      isTopLevelSearch: boolean,
      { currentItems, category }: { currentItems?: ListItem[]; category?: string }
    ) => {
      if (!onSearch && registry) {
        const nodeResults = registry.getNodeOptions(category, query);
        return Promise.resolve(nodeResults);
      }

      return (
        onSearch?.(query, isTopLevelSearch, currentItems ?? [])?.then((nodes) => {
          return nodes;
        }) ?? Promise.resolve([])
      );
    },
    [onSearch, registry]
  );

  const handleNodeListItemSelect = useCallback(
    (item: ListItem) => {
      onNodeSelect(item);
    },
    [onNodeSelect]
  );

  return (
    <Toolbox
      title={title ?? 'Add Node'}
      initialItems={nodeListOptions}
      loading={loading}
      onItemSelect={handleNodeListItemSelect}
      onSearch={handleSearch}
      onClose={onClose}
      onItemHover={onNodeHover}
    />
  );
}
