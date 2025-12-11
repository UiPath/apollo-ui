import type { TSpan } from '../../../../../../types/TraceModels';
import type { ApTreeViewItem } from '../../../../ap-tree-view';

export interface ITreeNode<T = any> {
  key: string;
  name: string;
  data: T;
  children?: Array<ITreeNode<T>>;
  expandedByDefault?: boolean;
}

export type ToolData = TSpan & {
    additionalInfo?: string;
    icon?: string;
    titleColor?: string;
    customIcon?: string;
    expanded?: boolean;
};
export type TreeSpanNode = ITreeNode<ToolData>;

export interface ApolloChatTreeRendererProps {
    span: TreeSpanNode;
    useApIcon?: boolean;
    onItemSelect?: (itemId: string, item: ApTreeViewItem) => void;
    transformSpanToTreeItem?: (spanNode: TreeSpanNode, key: string) => ApTreeViewItem | null;
    transformToTreeItems?: (span: TreeSpanNode) => ApTreeViewItem[];
}
