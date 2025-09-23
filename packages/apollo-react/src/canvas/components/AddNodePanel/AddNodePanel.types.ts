export interface NodeOption {
  id: string;
  type: string;
  label: string;
  icon?: React.FC | string;
  category: string;
  description?: string;
  version?: string;
}

export interface NodeCategory {
  id: string;
  label: string;
  icon?: React.FC | string;
  color?: string;
}

export interface AddNodePanelProps {
  onNodeSelect: (nodeType: NodeOption) => void;
  onClose: () => void;
  fetchNodeOptions?: (category?: string, search?: string) => Promise<NodeOption[]>;
  categories?: NodeCategory[];
  onCategoryChange?: (categoryId: string) => void;
  onCategoryHover?: (category: NodeCategory | null) => void;
}
