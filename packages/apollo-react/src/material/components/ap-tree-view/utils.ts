import type { ApTreeViewItem } from './ApTreeView.types';

/**
 * Recursively searches through tree items to find an item matching the predicate
 */
export function deepFind(
    items: ApTreeViewItem[],
    predicate: (item: ApTreeViewItem) => boolean
): ApTreeViewItem | undefined {
    for (const item of items) {
        if (predicate(item)) {
            return item;
        }
        if (item.children) {
            const found = deepFind(item.children, predicate);
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}

/**
 * Recursively expands all non-disabled items and returns their IDs
 */
export function recursivelyExpand(
    itemsToExpand: ApTreeViewItem[] | undefined
): string[] {
    if (!itemsToExpand || itemsToExpand.length === 0) {
        return [];
    }
    return itemsToExpand
        .filter((item) => !item.disabled)
        .map((item) => item.id)
        .concat(itemsToExpand.flatMap((item) => recursivelyExpand(item.children)));
}
