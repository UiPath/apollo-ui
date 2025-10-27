import type { ITreeNode } from '@uipath/apollo-angular-elements';
import type { TSpan } from '@uipath/portal-shell-util';

import type { ApTreeViewItem } from '../../../../ap-tree-view/ap-tree-view.react';

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
