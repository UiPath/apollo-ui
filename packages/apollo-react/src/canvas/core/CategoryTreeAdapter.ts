import type { ListItem } from '../components';
import type { NodeManifest } from '../schema/node-definition';
import type { CategoryTree, CategoryTreeNode } from './CategoryTree';

/**
 * Icon resolver function type.
 * Takes an icon name and returns a React component to render.
 */
export type IconResolver = (iconName: string) => React.ComponentType | undefined;

/**
 * Options for converting category tree to list items.
 */
export interface ToListItemsOptions {
  /** Function to resolve icon names to React components */
  iconResolver?: IconResolver;
}

/**
 * Adapter class for converting CategoryTree to various UI formats.
 *
 * Provides transformation methods to convert the hierarchical category tree
 * into different formats.
 *
 * Usage:
 * ```typescript
 * const adapter = new CategoryTreeAdapter(categoryTree);
 * const listItems = adapter.toListItems({ iconResolver: getIcon });
 * ```
 */
export class CategoryTreeAdapter {
  constructor(private tree: CategoryTree) {}

  /**
   * Convert the category tree to hierarchical list items for UI rendering.
   *
   * This method recursively transforms the category tree structure into a format
   * suitable for rendering in the toolbox component.
   *
   * Categories become parent list items with children arrays.
   * Nodes become leaf list items with their metadata.
   * Empty categories (no nodes or children) are filtered out by default.
   * Root-level nodes are included after categories.
   *
   * @param options - Configuration options for the conversion
   * @returns Array of list items representing the tree structure
   */
  toListItems(options: ToListItemsOptions = {}): ListItem[] {
    const { iconResolver } = options;

    const convertNodeManifest = (node: NodeManifest): ListItem => ({
      id: node.nodeType,
      name: node.display.label,
      description: node.description,
      data: {
        type: node.nodeType,
        category: node.category,
        version: node.version,
      },
      icon: iconResolver
        ? { Component: iconResolver(node.display.icon) }
        : { name: node.display.icon },
    });

    const convertCategories = (categoryNodes: CategoryTreeNode[]): ListItem[] => {
      const result: ListItem[] = [];

      for (const category of categoryNodes) {
        // Build nested children (both subcategories and nodes)
        const children: ListItem[] = [];

        // Add subcategories first (recursive)
        const nestedCategoryItems = convertCategories(category.nestedCategories);
        children.push(...nestedCategoryItems);

        // Add nodes in this category
        const nodeItems: ListItem[] = category.nodes.map(convertNodeManifest);
        children.push(...nodeItems);

        // Only include category if it has children.
        if (children.length === 0) {
          continue;
        }

        // Create category ListItem
        const categoryItem: ListItem = {
          id: category.id,
          name: category.name,
          data: null,
          icon: iconResolver ? { Component: iconResolver(category.icon) } : { name: category.icon },
          color: category.color,
          children,
        };

        result.push(categoryItem);
      }

      return result;
    };

    const items: ListItem[] = [];

    // Add root categories first
    const categoryItems = convertCategories(this.tree.getRootCategories());
    items.push(...categoryItems);

    // Add root nodes after categories
    const rootNodes = this.tree.getRootNodes();
    const rootNodeItems: ListItem[] = rootNodes.map(convertNodeManifest);
    items.push(...rootNodeItems);

    return items;
  }
}
