import React from 'react';

export type ApTreeViewItem = {
    /** Unique identifier for the item */
    id: string;
    /** Display title */
    title: string;
    /** Optional title color override */
    titleColor?: string;
    /** Optional description (shown in tooltip) */
    description?: string;
    /** Whether the item is expanded by default */
    expanded?: boolean;
    /** Child items */
    children?: ApTreeViewItem[];
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Icon name for the item */
    icon?: string;
    /** Icon color override */
    iconColor?: string;
    /** Custom icon name */
    customIcon?: string;
    /** Additional info text shown on the right */
    additionalInfo?: string;
};

export interface ApTreeViewProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Array of tree items */
    items: ApTreeViewItem[];
    /** Currently selected item ID */
    selectedItemId?: string;
    /** Whether to use ap-icon component */
    useApIcon?: boolean;
    /** Expanded state - boolean for all expanded, or array of IDs */
    expanded?: boolean | string[];
    /** Disable expand/collapse functionality */
    disableExpandCollapse?: boolean;
    /** Show chevron icon on selected items */
    showSelectedChevron?: boolean;
    /** Callback when selection changes */
    onSelectedItemsChange?: (newSelectedItemId: string | undefined) => void;
}

export interface ApTreeItemProps {
    /** Item ID */
    itemId: string;
    /** Function to get item data */
    getItem: (itemId: string) => ApTreeViewItem;
    /** Child tree items */
    children?: React.ReactNode;
    /** Disable expand/collapse */
    disableExpandCollapse?: boolean;
    /** Show chevron on selected items */
    showSelectedChevron?: boolean;
    /** Use ap-icon component */
    useApIcon?: boolean;
}
