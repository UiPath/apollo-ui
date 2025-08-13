export interface NodeOption {
  id: string;
  type: string;
  label: string;
  icon?: string;
  category: string;
  description?: string;
}

export interface NodeCategory {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface AddNodePanelProps {
  sourceNodeId: string;
  sourceHandleId: string;
  onNodeSelect: (nodeType: NodeOption) => void;
  onClose: () => void;
  fetchNodeOptions?: (category?: string, search?: string) => Promise<NodeOption[]>;
}
