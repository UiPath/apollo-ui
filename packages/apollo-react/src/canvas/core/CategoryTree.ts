import type { CategoryManifest, NodeManifest } from '../schema/node-definition';

/**
 * Category tree node for building hierarchical structure.
 */
export interface CategoryTreeNode extends CategoryManifest {
  nestedCategories: CategoryTreeNode[];
  nodes: NodeManifest[];
}

/**
 * Filter options for category tree filtering operations.
 */
export interface CategoryTreeFilterOptions {
  /** Filter function for categories. Return true to include the category. */
  categoryFilter?: (category: CategoryTreeNode) => boolean;
  /** Filter function for nodes. Return true to include the node. */
  nodeFilter?: (node: NodeManifest) => boolean;
}

/**
 * Interface for validating node connections.
 * Implementors provide logic to determine if categories/nodes are valid for specific connections.
 */
export interface ConnectionValidator {
  /**
   * Check if a category is valid for the given connection context.
   * @param categoryId - The category ID to validate
   * @returns true if the category is valid for connections
   */
  isValidCategoryForConnection(categoryId: string): boolean;

  /**
   * Check if a node can connect in the given connection context.
   * @param nodeType - The node type to validate
   * @returns true if the node can connect
   */
  canNodeConnect(nodeType: string): boolean;
}

/**
 * Immutable category tree data structure with filtering and traversal capabilities.
 *
 * Features:
 * - Builds hierarchical tree from flat category/node lists
 * - Supports both categories and nodes at root level
 * - Immutable filtering operations (returns new trees)
 * - Composable filter methods
 * - Search functionality
 * - Single-path flattening for better UX
 * - Type-safe traversal
 *
 * Usage:
 * ```typescript
 * const tree = new CategoryTree(categories, nodes);
 *
 * // Filter and chain operations
 * const filtered = tree
 *   .getSubtree('automation')
 *   .filterBySearch('email')
 *   .flattenSinglePaths();
 *
 * // Get root categories
 * const roots = tree.getRootCategories();
 * // Get root nodes
 * const rootNodes = tree.getRootNodes();
 * ```
 */
export class CategoryTree {
  private rootCategories: CategoryTreeNode[];
  private rootNodes: NodeManifest[];
  private categoryMap: Map<string, CategoryTreeNode>;

  /**
   * Create a new CategoryTree from flat category and node lists.
   *
   * @param categories - Flat array of category manifests
   * @param nodes - Array of node manifests
   */
  constructor(categories: CategoryManifest[], nodes: NodeManifest[]) {
    this.categoryMap = new Map<string, CategoryTreeNode>();
    const { rootCategories, rootNodes } = this.buildTree(categories, nodes);
    this.rootCategories = rootCategories;
    this.rootNodes = rootNodes;
  }

  /**
   * Build a map of category IDs to category tree nodes.
   *
   * @internal
   */
  static buildMap(tree: CategoryTreeNode[]): Map<string, CategoryTreeNode> {
    // Build new category map from filtered tree
    const newCategoryMap = new Map<string, CategoryTreeNode>();
    const buildMapHelper = (t: CategoryTreeNode[]) => {
      for (const tNode of t) {
        newCategoryMap.set(tNode.id, tNode);
        buildMapHelper(tNode.nestedCategories);
      }
    };
    buildMapHelper(tree);
    return newCategoryMap;
  }

  /**
   * Create a CategoryTree instance from pre-built structure.
   * Used internally for immutable operations.
   *
   * @internal
   */
  static fromPrebuilt(rootCategories: CategoryTreeNode[], rootNodes: NodeManifest[]): CategoryTree {
    const tree = Object.create(CategoryTree.prototype);
    tree.rootCategories = rootCategories;
    tree.rootNodes = rootNodes;
    tree.categoryMap = CategoryTree.buildMap(rootCategories);
    return tree;
  }

  /**
   * Build hierarchical category tree from flat array.
   *
   * Converts flat category list into nested structure:
   * - Creates map of all categories
   * - Assigns nodes to their categories or root level
   * - Builds parent-child relationships
   * - Sorts at each level by sortOrder
   * - Returns root categories and root nodes
   */
  buildTree(
    categories: CategoryManifest[],
    nodes: NodeManifest[]
  ): { rootCategories: CategoryTreeNode[]; rootNodes: NodeManifest[] } {
    // Create lookup map for all categories
    const categoryMap = new Map<string, CategoryTreeNode>();

    // Initialize category nodes
    for (const category of categories) {
      categoryMap.set(category.id, {
        ...category,
        nestedCategories: [],
        nodes: [],
      });
    }

    // Separate root nodes from categorized nodes
    const rootNodes: NodeManifest[] = [];

    // Assign nodes to their categories or to root level
    for (const node of nodes) {
      if (!node.category) {
        // Node has no category - add to root level
        rootNodes.push(node);
      } else {
        const category = categoryMap.get(node.category);
        if (category) {
          category.nodes.push(node);
        } else {
          // Category doesn't exist - treat node as root level
          rootNodes.push(node);
        }
      }
    }

    // Sort nodes within each category
    for (const category of categoryMap.values()) {
      category.nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // Build parent-child relationships using parentId
    const rootCategories: CategoryTreeNode[] = [];

    for (const category of categoryMap.values()) {
      const parentId = category.parentId;

      if (!parentId) {
        // Root category (parentId is null or undefined)
        rootCategories.push(category);
      } else {
        // Child category - attach to parent
        const parent = categoryMap.get(parentId);
        if (parent) {
          parent.nestedCategories.push(category);
        } else {
          // Parent doesn't exist - treat as root
          rootCategories.push(category);
        }
      }
    }

    // Sort children at each level by sortOrder
    const sortChildren = (node: CategoryTreeNode) => {
      node.nestedCategories.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const child of node.nestedCategories) {
        sortChildren(child);
      }
    };

    // Sort root categories and all descendants
    rootCategories.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const root of rootCategories) {
      sortChildren(root);
    }

    // Sort root nodes by sortOrder
    rootNodes.sort((a, b) => a.sortOrder - b.sortOrder);

    // Store in instance map for lookups
    this.categoryMap = categoryMap;

    return { rootCategories, rootNodes };
  }

  /**
   * Get the root categories of the tree.
   *
   * @returns Array of root-level category nodes
   */
  getRootCategories(): CategoryTreeNode[] {
    return this.rootCategories;
  }

  /**
   * Get the root nodes of the tree (nodes without a category).
   *
   * @returns Array of root-level nodes
   */
  getRootNodes(): NodeManifest[] {
    return this.rootNodes;
  }

  /**
   * Find a category node by ID.
   *
   * @param categoryId - The category ID to find
   * @returns The category node or null if not found
   */
  findCategory(categoryId: string): CategoryTreeNode | null {
    return this.categoryMap.get(categoryId) ?? null;
  }

  /**
   * Get a subtree starting from a specific category.
   * Returns a new CategoryTree instance containing only the specified category and its descendants.
   *
   * @param categoryId - The category ID to start from, or 'all' for the entire tree
   * @returns New CategoryTree instance, or empty tree if category not found
   */
  getSubtree(categoryId: string): CategoryTree {
    const category = this.findCategory(categoryId);
    if (!category) {
      // Return empty tree
      return CategoryTree.fromPrebuilt([], []);
    }

    // Create new tree with this category as the root.
    return CategoryTree.fromPrebuilt([...category.nestedCategories], [...category.nodes]);
  }

  /**
   * Filter the category tree with custom filter functions.
   *
   * Recursively traverses the category tree, applying the provided filter functions.
   * Categories are included if they pass the category filter AND have at least one
   * matching child (category or node). Root nodes are filtered independently.
   *
   * This is an immutable operation - returns a new CategoryTree instance.
   *
   * @param options - Filter options with category and node filter functions
   * @returns New filtered CategoryTree instance
   */
  filter(options: CategoryTreeFilterOptions = {}): CategoryTree {
    const { categoryFilter = () => true, nodeFilter = () => true } = options;

    const filterTree = (tree: CategoryTreeNode[]): CategoryTreeNode[] => {
      const filtered: CategoryTreeNode[] = [];

      for (const item of tree) {
        // Check if category passes filter
        if (!categoryFilter(item)) continue;

        // Recursively filter nested categories
        const nestedCategories = filterTree(item.nestedCategories);

        // Filter nodes
        const nodes = item.nodes.filter(nodeFilter);

        // Include category only if it has children or nodes
        if (nestedCategories.length > 0 || nodes.length > 0) {
          filtered.push({
            ...item,
            nestedCategories,
            nodes,
          });
        }
      }

      return filtered;
    };

    const filteredRoots = filterTree(this.rootCategories);
    // Filter root nodes
    const filteredRootNodes = this.rootNodes.filter(nodeFilter);

    return CategoryTree.fromPrebuilt(filteredRoots, filteredRootNodes);
  }

  /**
   * Filter the tree by search term.
   * Searches node labels, types, descriptions, and tags.
   *
   * This is an immutable operation - returns a new CategoryTree instance.
   *
   * @param searchTerm - Search string to match against nodes
   * @returns New filtered CategoryTree instance
   */
  filterBySearch(searchTerm: string): CategoryTree {
    if (!searchTerm) {
      return this;
    }

    const searchLower = searchTerm.toLowerCase();

    return this.filter({
      nodeFilter: (node) => {
        const matchesLabel = node.display.label.toLowerCase().includes(searchLower);
        const matchesType = node.nodeType.toLowerCase().includes(searchLower);
        const matchesDescription = node.description?.toLowerCase().includes(searchLower);
        const matchesTags = node.tags?.some(
          (tag) => typeof tag === 'string' && tag.toLowerCase().includes(searchLower)
        );

        return matchesLabel || matchesType || matchesDescription || matchesTags;
      },
    });
  }

  /**
   * Filter the tree by connection constraints.
   *
   * Uses a ConnectionValidator to determine which categories and nodes are valid
   * for the current connection context. This is typically used when adding a new node
   * that must connect to existing nodes with specific handle constraints.
   *
   * This is an immutable operation - returns a new CategoryTree instance.
   *
   * @param validator - Connection validator that provides validation logic
   * @returns New filtered CategoryTree instance
   */
  filterByConnections(validator: ConnectionValidator): CategoryTree {
    return this.filter({
      categoryFilter: (category) => validator.isValidCategoryForConnection(category.id),
      nodeFilter: (node) => validator.canNodeConnect(node.nodeType),
    });
  }

  /**
   * Flatten single-path categories for cleaner UX.
   *
   * Walks down the tree while there is a single nested category with no nodes.
   * - If the path leads to a leaf category, its nodes are brought to root level.
   * - If the path leads to a branch point (multiple nested categories or leaf nodes),
   *   the tree is re-rooted at that category.
   * - If the tree already has multiple root categories, returns unchanged.
   *
   * This is an immutable operation - returns a new CategoryTree instance.
   *
   * @returns New CategoryTree instance with flattened single paths
   */
  flattenSinglePath(): CategoryTree {
    // Only flatten if we have exactly one root category
    if (this.rootCategories.length !== 1 || this.rootNodes.length > 0) {
      return CategoryTree.fromPrebuilt([...this.rootCategories], [...this.rootNodes]);
    }

    // Walk down the path while it is a single child category with no nodes.
    let current = this.rootCategories[0];
    while (current) {
      if (current.nestedCategories.length === 1 && current.nodes.length === 0) {
        // Continue down the single path
        current = current.nestedCategories[0];
      } else {
        // Reached a branch point - break to return tree rooted here
        break;
      }
    }

    return current
      ? CategoryTree.fromPrebuilt([...current.nestedCategories], [...current.nodes])
      : CategoryTree.fromPrebuilt([], []);
  }

  /**
   * Flatten the entire tree - bring all nodes to root level.
   *
   * @returns New CategoryTree instance with all nodes at root level
   */
  flatten(): CategoryTree {
    const collectNodes = (categories: CategoryTreeNode[]): NodeManifest[] => {
      let nodes: NodeManifest[] = [];
      for (const category of categories) {
        nodes = nodes.concat(category.nodes);
        nodes = nodes.concat(collectNodes(category.nestedCategories));
      }
      return nodes;
    };

    const allNodes = collectNodes(this.rootCategories).concat(this.rootNodes);
    allNodes.sort((a, b) => a.sortOrder - b.sortOrder);
    return CategoryTree.fromPrebuilt([], allNodes);
  }

  /**
   * Check if the tree is empty (no root categories or root nodes).
   *
   * @returns true if the tree has no root categories or root nodes
   */
  isEmpty(): boolean {
    return this.rootCategories.length === 0 && this.rootNodes.length === 0;
  }

  /**
   * Get all categories in the tree as a flat array.
   *
   * @returns Array of all category nodes in the tree
   */
  getAllCategories(): CategoryTreeNode[] {
    return Array.from(this.categoryMap.values());
  }

  /**
   * Get all nodes in the tree as a flat array.
   *
   * @returns Array of all node manifests in the tree
   */
  getAllNodes(): NodeManifest[] {
    const nodes: NodeManifest[] = [...this.rootNodes];
    for (const category of this.categoryMap.values()) {
      nodes.push(...category.nodes);
    }
    return nodes;
  }

  /**
   * Get the total number of categories in the tree.
   *
   * @returns Number of categories
   */
  getCategoryCount(): number {
    return this.categoryMap.size;
  }

  /**
   * Get the total number of nodes in the tree.
   *
   * @returns Number of nodes
   */
  getNodeCount(): number {
    let count = this.rootNodes.length;
    for (const category of this.categoryMap.values()) {
      count += category.nodes.length;
    }
    return count;
  }
}
