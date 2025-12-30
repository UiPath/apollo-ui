import type { ListItem } from '../Toolbox';

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
}
