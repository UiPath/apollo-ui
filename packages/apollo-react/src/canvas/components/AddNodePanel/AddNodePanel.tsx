import { useCallback, useMemo } from 'react';
import { useOptionalNodeTypeRegistry } from '../../core';
import { usePreviewNode } from '../../hooks';
import { getIcon } from '../../utils/icon-registry';
import { type ListItem, Toolbox } from '../Toolbox';
import type { AddNodePanelProps } from './AddNodePanel.types';

/**
 * Panel component that displays available nodes for adding to the canvas.
 *
 * This component filters nodes based on connection constraints when adding nodes
 * from existing handles. It uses a two-stage filtering approach for optimal performance:
 * 1. Category-level filtering to quickly eliminate entire invalid categories
 * 2. Node-level filtering for comprehensive constraint validation
 */
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
  const { previewNodeConnectionInfo } = usePreviewNode();

  /**
   * Compute the list of available node options with constraint-based filtering.
   *
   * Uses the registry's getAvailableNodes API with:
   * - Connection constraint filtering
   * - List item format for UI rendering
   * - UI optimizations (single path flattening)
   * - Icon resolution
   */
  const nodeListOptions = useMemo((): ListItem[] => {
    if (items) return items;
    if (!registry) return [];

    return registry.getNodeOptions({
      connections: previewNodeConnectionInfo,
      flattenSinglePath: true,
      iconResolver: getIcon,
    });
  }, [items, registry, previewNodeConnectionInfo]);

  const handleSearch = useCallback(
    (
      query: string,
      isTopLevelSearch: boolean,
      { currentItems, category }: { currentItems?: ListItem[]; category?: string }
    ) => {
      if (!onSearch && registry) {
        const listItems = registry.getNodeOptions({
          connections: previewNodeConnectionInfo,
          category,
          search: query,
          flattenAll: true,
          iconResolver: getIcon,
        });
        return Promise.resolve(listItems);
      }

      return (
        onSearch?.(query, isTopLevelSearch, currentItems ?? [])?.then((nodes) => {
          return nodes;
        }) ?? Promise.resolve([])
      );
    },
    [registry, previewNodeConnectionInfo, onSearch]
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
