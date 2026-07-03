import type { ListItem, ToolboxEmptyStateRenderer } from '../Toolbox';

export interface NodeItemData {
  type: string;
  version?: string;
  category?: string;
}

export interface AddNodePanelProps {
  onNodeSelect: (item: ListItem) => void;
  onClose: () => void;
  onNodeHover?: (item: ListItem) => void;
  onSearch?: (
    query: string,
    isTopLevelSearch: boolean,
    currentItems: ListItem[]
  ) => Promise<ListItem[]>;
  title?: string;
  /**
   * The options to show in the panel.
   * When left undefined, the panel will generate options from the NodeTypeRegistry.
   */
  items?: ListItem[];
  loading?: boolean;
  /**
   * Custom render for the empty-state body. Invoked only when the user has
   * navigated into a category (or is at the root) and the list is empty —
   * not during search. Receives the currently-selected category as context.
   * When provided, replaces the built-in icon + message empty state.
   */
  renderEmptyState?: ToolboxEmptyStateRenderer<NodeItemData>;
  /**
   * Placeholder for the search input. Should describe what will be searched,
   * such as "Search agents". Defaults to "Search nodes".
   */
  searchPlaceholder?: string;
}
