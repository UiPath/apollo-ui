import type { BaseNodeData, ListItem } from '../components';
import type { PreviewNodeConnectionInfo } from '../hooks';
import type {
  CategoryManifest,
  HandleManifest,
  NodeManifest,
  WorkflowManifest,
} from '../schema/node-definition';
import type { DisplayConfig } from '../schema/workflow/base';
import {
  type ConnectionValidationContext,
  checkCategoryConstraint,
  validateConnection,
} from '../utils';
import { CategoryTree, type ConnectionValidator } from './CategoryTree';
import { CategoryTreeAdapter } from './CategoryTreeAdapter';

interface NodeHandles {
  source?: HandleManifest[];
  target?: HandleManifest[];
}

/**
 * Registry for node type manifests.
 * Manages node type definitions using JSON manifests instead of React components.
 */
export class NodeTypeRegistry {
  private categoryById = new Map<string, CategoryManifest>();
  private nodeByType = new Map<string, NodeManifest>();
  private nodeHandles = new Map<string, NodeHandles>();
  private categoriesByParent = new Map<string | undefined, CategoryManifest[]>();
  private nodesByCategory = new Map<string | undefined, NodeManifest[]>();
  private categoryAncestors = new Map<string, string[]>();
  private categoryDescendants = new Map<string, string[]>();
  private categoryTree: CategoryTree | null = null;

  /**
   * Register multiple node manifests at once.
   * Categories will be implicitly created based on node config.
   *
   * @param nodes - Array of node manifests to register
   *
   * @deprecated Use registerManifest with full WorkflowManifest instead to .
   */
  registerNodeManifests(nodes: NodeManifest[]) {
    // Extract unique categories from nodes
    const categoryMap = new Map<string, CategoryManifest>();
    for (const node of nodes) {
      const categoryId = node.category;
      if (categoryId) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          sortOrder: 0,
          tags: [],
          color: node.display.color ?? 'transparent',
          colorDark: 'transparent',
          icon: node.display.icon ?? 'box',
        });
      }
    }

    const workflowManifest: WorkflowManifest = {
      version: '0',
      categories: Array.from(categoryMap.values()),
      nodes,
    };

    this.registerManifest(workflowManifest);
  }

  /**
   * Build all manifest caches in a single pass
   *
   * Creates lookup maps and pre-computes hierarchical relationships
   * to eliminate repeated O(n) searches during runtime.
   *
   * @param manifest - The workflow manifest to cache
   */
  registerManifest(manifest: WorkflowManifest) {
    // Build direct lookup maps O(n) + O(m)
    this.categoryById = new Map(manifest.categories.map((c) => [c.id, c]));
    this.nodeByType = new Map(manifest.nodes.map((n) => [n.nodeType, n]));
    this.nodeHandles = new Map<string, NodeHandles>(
      manifest.nodes.map((n) => [
        n.nodeType,
        n.handleConfiguration
          .flatMap((hc) => hc.handles)
          .reduce((acc, handle) => {
            if (!acc[handle.type]) {
              acc[handle.type] = [];
            }
            acc[handle.type]?.push(handle);
            return acc;
          }, {} as NodeHandles),
      ])
    );

    // Build parent-child relationships O(n)
    this.categoriesByParent = new Map<string | undefined, CategoryManifest[]>();
    for (const cat of manifest.categories) {
      const siblings = this.categoriesByParent.get(cat.parentId) ?? [];
      siblings.push(cat);
      this.categoriesByParent.set(cat.parentId, siblings);
    }

    // Pre-compute ancestors for each category O(n * depth)
    this.categoryAncestors = new Map<string, string[]>();
    for (const cat of manifest.categories) {
      const ancestors: string[] = [];
      let currentId = cat.parentId;
      while (currentId) {
        ancestors.push(currentId);
        currentId = this.categoryById.get(currentId)?.parentId;
      }
      this.categoryAncestors.set(cat.id, ancestors);
    }

    // Pre-compute descendants for each category O(n * fan out)
    this.categoryDescendants = new Map<string, string[]>();
    for (const cat of manifest.categories) {
      const descendants: string[] = [];
      const queue = [cat.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = this.categoriesByParent.get(current) ?? [];
        for (const child of children) {
          descendants.push(child.id);
          queue.push(child.id);
        }
      }
      this.categoryDescendants.set(cat.id, descendants);
    }

    // Build category-to-nodes mapping O(m)
    // Note: nodes without a category are stored with undefined as the key
    this.nodesByCategory = new Map<string, NodeManifest[]>();
    for (const node of manifest.nodes) {
      const categoryKey = node.category ?? undefined;
      const nodes = this.nodesByCategory.get(categoryKey) ?? [];
      nodes.push(node);
      this.nodesByCategory.set(categoryKey, nodes);
    }

    // Build hierarchical category tree O(n)
    this.categoryTree = new CategoryTree(manifest.categories, manifest.nodes);
  }

  /**
   * Get a node manifest by type.
   * @param nodeType - Node type identifier
   * @returns Node manifest or undefined if not found
   */
  getManifest(nodeType: string): NodeManifest | undefined {
    return this.nodeByType.get(nodeType);
  }

  /**
   * Get all registered manifests.
   * @returns Array of all node manifests
   */
  getAllManifests(): NodeManifest[] {
    return Array.from(this.nodeByType.values());
  }

  /**
   * Get all registered categories.
   * @returns Array of category identifiers
   */
  getAllCategories(): string[] {
    return Array.from(this.categoryById.keys());
  }

  /**
   * Get all registered node types.
   * @returns Array of node type identifiers
   */
  getAllNodeTypes(): string[] {
    return Array.from(this.nodeByType.keys());
  }

  /**
   * Get handles handles for a given node. Will be organized by handle type (source/target).
   */
  getHandlesByNodeType(nodeType: string): NodeHandles {
    return this.nodeHandles.get(nodeType) ?? {};
  }

  /**
   * Get the default handle for a given node type and handle type.
   */
  getDefaultHandle(nodeType: string, handleType: 'source' | 'target'): HandleManifest | undefined {
    const handles = this.nodeHandles.get(nodeType)?.[handleType];
    return handles?.find((h) => h.isDefaultForType) ?? handles?.[0];
  }

  /**
   * Create default data for a new node instance.
   * @param nodeType - Node type identifier
   * @param label - Optional custom label
   * @returns Default node data
   */
  createDefaultData(nodeType: string, label?: string): BaseNodeData {
    const manifest = this.getManifest(nodeType);

    if (!manifest) {
      // Return minimal data if manifest not found
      return {
        nodeType,
        version: '1.0.0',
        display: {
          label: label || nodeType,
        },
      };
    }

    // Build default display from manifest
    const display: DisplayConfig = {
      label: label || manifest.display.label,
      icon: manifest.display.icon,
      shape: manifest.display.shape,
      color: manifest.display.color,
      background: manifest.display.background,
      iconBackground: manifest.display.iconBackground,
      iconBackgroundDark: manifest.display.iconBackgroundDark,
    };

    return {
      nodeType,
      version: manifest.version,
      parameters: manifest.defaultProperties ?? {},
      display: display as BaseNodeData['display'],
    };
  }

  /**
   * Get the category tree instance.
   * @returns CategoryTree instance or null if not initialized
   */
  getCategoryTree(): CategoryTree | null {
    return this.categoryTree;
  }

  /**
   * Clear all registrations (useful for testing or re-initialization).
   */
  clear(): void {
    this.nodesByCategory.clear();
    this.nodeHandles.clear();
    this.nodeByType.clear();
    this.categoryById.clear();
    this.categoryAncestors.clear();
    this.categoryDescendants.clear();
    this.categoriesByParent.clear();
    this.categoryTree = null;
  }

  /**
   * Filter function to determine if a category should be shown based on handle constraints.
   *
   * This provides early filtering at the category level, eliminating entire categories
   * before expensive per-node validation occurs.
   *
   * For nested categories, this checks if the category OR any of its descendants match
   * the constraints. This ensures parent categories are shown if they have valid children.
   *
   * @param categoryId - The category ID to validate
   * @param previewNodeConnectionInfo - Array of preview node connection info for constraint checks
   * @returns true if the category should be shown, false if it should be filtered out
   */
  isValidCategoryForConnection(
    categoryId: string,
    previewNodeConnectionInfo: PreviewNodeConnectionInfo[] | null | undefined
  ): boolean {
    // If no preview connection info, show all categories
    if (!previewNodeConnectionInfo || previewNodeConnectionInfo.length === 0) return true;

    // Get descendant categories from cache (O(1) lookup instead of O(n) search)
    const descendantCategories = this.categoryDescendants.get(categoryId) ?? [];
    const categoriesToCheck = [categoryId, ...descendantCategories];

    // The category (or one of its descendants) must pass constraint checks for every connection
    for (const connection of previewNodeConnectionInfo) {
      // Use cached handle manifest instead of looking it up
      const existingHandleConstraints = connection.existingHandleManifest?.constraints;
      if (!existingHandleConstraints) continue;

      // Determine which category constraints apply based on connection direction
      const allowedCategories = connection.addNewNodeAsSource
        ? existingHandleConstraints.allowedSourceCategories
        : existingHandleConstraints.allowedTargetCategories;
      const forbiddenCategories = connection.addNewNodeAsSource
        ? existingHandleConstraints.forbiddenSourceCategories
        : existingHandleConstraints.forbiddenTargetCategories;

      // Check if this category or any of its descendants match the constraints
      const hasValidDescendant = categoriesToCheck.some((catId) =>
        checkCategoryConstraint(catId, allowedCategories, forbiddenCategories)
      );

      if (!hasValidDescendant) {
        return false;
      }
    }
    return true;
  }

  /**
   * Filter function to determine if a specific node can connect based on handle constraints.
   *
   * This performs comprehensive validation including:
   * - Node type compatibility
   * - Handle type compatibility (source/target)
   * - Custom validation rules
   *
   * @param nodeType - The node type to validate
   * @returns true if the node should be shown, false if it should be filtered out
   */
  isValidNodeForConnection(
    nodeType: string,
    previewNodeConnectionInfo: PreviewNodeConnectionInfo[] | null | undefined
  ) {
    // If no preview connection info, show all nodes
    if (!previewNodeConnectionInfo || previewNodeConnectionInfo.length === 0) return true;

    // Get the manifest for this node type
    const nodeItemManifest = this.nodeByType.get(nodeType);
    if (!nodeItemManifest) return false;

    // Validate against each connection
    for (const connection of previewNodeConnectionInfo) {
      // Use cached manifests instead of looking them up
      const { existingNodeManifest, existingHandleManifest } = connection;
      if (!existingNodeManifest || !existingHandleManifest) return false;

      // Build nodes for validation
      const existingNodeData = {
        type: existingNodeManifest.nodeType,
        category: existingNodeManifest.category,
      };
      const nodeToValidateData = {
        type: nodeItemManifest.nodeType,
        category: nodeItemManifest.category,
      };

      // Find the appropriate handle on the new node based on connection direction
      const defaultNodeItemHandle = this.getDefaultHandle(
        nodeType,
        connection.addNewNodeAsSource ? 'source' : 'target'
      );
      if (!defaultNodeItemHandle) return false;

      // Build connection validation context based on direction
      const connectionValidationData: ConnectionValidationContext = connection.addNewNodeAsSource
        ? {
            // New node is source, existing node is target
            sourceNode: nodeToValidateData,
            sourceHandle: defaultNodeItemHandle,
            targetNode: existingNodeData,
            targetHandle: existingHandleManifest,
          }
        : {
            // Existing node is source, new node is target
            sourceNode: existingNodeData,
            sourceHandle: existingHandleManifest,
            targetNode: nodeToValidateData,
            targetHandle: defaultNodeItemHandle,
          };

      // Perform full constraint validation
      const isValidConnection = validateConnection(connectionValidationData).valid;
      if (!isValidConnection) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create a connection validator from preview node connection info.
   *
   * @param connectionInfo - Connection info for validation
   * @returns ConnectionValidator instance
   */
  private createConnectionValidator(
    connectionInfo: PreviewNodeConnectionInfo[] | null | undefined
  ): ConnectionValidator {
    return {
      isValidCategoryForConnection: (categoryId: string) =>
        this.isValidCategoryForConnection(categoryId, connectionInfo),
      canNodeConnect: (nodeType: string) => this.isValidNodeForConnection(nodeType, connectionInfo),
    };
  }

  /**
   * Get available nodes with flexible filtering and formatting options.
   *
   * This is the recommended method for retrieving filtered nodes. It provides a clean,
   * composable API for common filtering scenarios.
   *
   * @param options - Filtering and formatting options
   * @param options.connections - Optional connection constraints to apply
   * @param options.category - Optional category ID to start from ('all' for root)
   * @param options.search - Optional search term for filtering nodes
   * @param options.flattenAll - When true, flattens all categories for UI simplicity.
   * @param options.flattenSinglePath - When true, flattens when only a single path to leaf nodes exists.
   * @returns Filtered results in the specified format
   *
   * @example
   * // Get filtered tree
   * const tree = registry.getNodeOptions({
   *   connections: previewNodeConnectionInfo,
   * });
   *
   * @example
   * // Get list items for UI
   * const items = registry.getNodeOptions({
   *   connections: previewNodeConnectionInfo,
   *   search: 'email',
   * });
   */
  getNodeOptions(options: {
    connections?: PreviewNodeConnectionInfo[] | null;
    category?: string;
    search?: string;
    flattenAll?: boolean;
    flattenSinglePath?: boolean;
  }): ListItem[] {
    const {
      connections,
      category,
      search,
      flattenAll = false,
      flattenSinglePath = false,
    } = options;

    let tree = this.getCategoryTree();
    if (!tree) {
      // Return empty based on format
      return [];
    }

    // Start at subtree when category specified
    if (category) {
      tree = tree.getSubtree(category);
    }

    // Filter by connection constraints if provided
    if (connections) {
      const validator = this.createConnectionValidator(connections);
      tree = tree.filterByConnections(validator);
    }

    // Apply search filter if specified
    if (search) {
      tree = tree.filterBySearch(search);
    }

    // Apply UI optimizations if requested
    if (flattenAll) {
      tree = tree.flatten();
    } else if (flattenSinglePath) {
      tree = tree.flattenSinglePath();
    }

    const adapter = new CategoryTreeAdapter(tree);
    return adapter.toListItems();
  }
}
