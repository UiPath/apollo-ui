import {
  type NodeManifest,
  type NodeShape,
  nodeManifestSchema,
} from '../../schema/node-definition/node-manifest';
import type { DisplayConfig } from '../../schema/workflow/base';
import type { NodeItemData } from '../AddNodePanel/AddNodePanel.types';
import type { ListItem } from '../Toolbox';
import type { BaseNodeData } from './BaseNode.types';

/**
 * Registry for node type manifests.
 * Manages node type definitions using JSON manifests instead of React components.
 */
export class NodeTypeRegistry {
  private manifests = new Map<string, NodeManifest>();
  private categories = new Map<string, string[]>();

  /**
   * Register a node manifest with validation.
   * @param manifest - Node manifest to register
   * @throws {Error} If manifest validation fails
   */
  registerManifest(manifest: NodeManifest): void {
    // Validate manifest with Zod
    const result = nodeManifestSchema.safeParse(manifest);

    if (!result.success) {
      throw new Error(
        `Failed to register manifest for ${manifest.nodeType}: ${result.error.message}`
      );
    }

    const validated = result.data;
    const nodeType = validated.nodeType;
    this.manifests.set(nodeType, validated);

    // TODO: register categories directly from workflow manifest response
    // Update category index
    const category = validated.category || 'misc';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }

    // Only add if not already in category
    const categoryNodes = this.categories.get(category)!;
    if (!categoryNodes.includes(nodeType)) {
      categoryNodes.push(nodeType);
    }
  }

  /**
   * Get a node manifest by type.
   * @param nodeType - Node type identifier
   * @returns Node manifest or undefined if not found
   */
  getManifest(nodeType: string): NodeManifest | undefined {
    return this.manifests.get(nodeType);
  }

  /**
   * Get all node types in a category.
   * @param category - Category identifier
   * @returns Array of node type identifiers
   */
  getByCategory(category: string): string[] {
    return this.categories.get(category) || [];
  }

  /**
   * Get all registered categories.
   * @returns Array of category identifiers
   */
  getAllCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get all registered node types.
   * @returns Array of node type identifiers
   */
  getAllNodeTypes(): string[] {
    return Array.from(this.manifests.keys());
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
        parameters: {},
        display: {
          label: label || nodeType,
        },
      };
    }

    // Build default display from manifest
    const display: DisplayConfig = {
      label: label || manifest.display.label,
      icon: manifest.display.icon,
      shape: manifest.display.shape as NodeShape | undefined,
      color: manifest.display.color,
      background: manifest.display.background,
      iconBackground: manifest.display.iconBackground,
    };

    return {
      nodeType,
      version: manifest.version,
      parameters: manifest.defaultProperties ?? {},
      display: display as BaseNodeData['display'],
    };
  }

  /**
   * Get node options for AddNodePanel.
   * @param category - Filter by category (optional)
   * @param search - Search term for filtering (optional)
   * @returns Array of ListItem objects for node selection
   */
  getNodeOptions(category?: string, search?: string): ListItem<NodeItemData>[] {
    const options: ListItem<NodeItemData>[] = [];

    for (const [nodeType, manifest] of this.manifests.entries()) {
      // Skip deprecated nodes
      if (manifest.deprecated) continue;

      // Filter by category if specified
      if (category && category !== 'all' && manifest.category !== category) continue;

      // Filter by search term if specified
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesLabel = manifest.display.label.toLowerCase().includes(searchLower);
        const matchesType = nodeType.toLowerCase().includes(searchLower);
        const matchesDescription = manifest.description?.toLowerCase().includes(searchLower);
        const matchesTags = manifest.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesLabel && !matchesType && !matchesDescription && !matchesTags) continue;
      }

      options.push({
        id: nodeType,
        name: manifest.display.label,
        icon: { name: manifest.display.icon },
        description: manifest.description,
        data: {
          type: nodeType,
          category: manifest.category,
          version: manifest.version,
        },
      });
    }

    // Sort by sortOrder, then by label
    options.sort((a, b) => {
      const aManifest = this.manifests.get(a.id);
      const bManifest = this.manifests.get(b.id);
      const aOrder = aManifest?.sortOrder ?? 999;
      const bOrder = bManifest?.sortOrder ?? 999;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });

    return options;
  }

  /**
   * Search for node types.
   * @param query - Search query
   * @returns Array of matching node type identifiers
   */
  searchNodeTypes(query: string): string[] {
    const searchLower = query.toLowerCase();
    const matches: string[] = [];

    for (const [nodeType, manifest] of this.manifests.entries()) {
      if (manifest.deprecated) continue;

      const matchesLabel = manifest.display.label.toLowerCase().includes(searchLower);
      const matchesType = nodeType.toLowerCase().includes(searchLower);
      const matchesDescription = manifest.description?.toLowerCase().includes(searchLower);
      const matchesTags = manifest.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

      if (matchesLabel || matchesType || matchesDescription || matchesTags) {
        matches.push(nodeType);
      }
    }

    return matches;
  }

  /**
   * Get category configuration for AddNodePanel.
   * @returns Array of category items with metadata
   */
  getCategoryConfig(): ListItem[] {
    const categoriesMap = new Map<string, ListItem>();

    for (const [_nodeType, manifest] of this.manifests.entries()) {
      if (!manifest.deprecated && manifest.category) {
        const categoryId = manifest.category;

        // Only add category if not already in map
        if (!categoriesMap.has(categoryId)) {
          const categoryMeta: ListItem = {
            id: categoryId,
            name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
            icon: { name: manifest.display.icon },
            data: null,
          };

          categoriesMap.set(categoryId, categoryMeta);
        }
      }
    }

    return Array.from(categoriesMap.values());
  }

  /**
   * Register multiple node manifests at once.
   * @param manifests - Array of node manifests to register
   */
  registerAll(manifests: NodeManifest[]): void {
    manifests.forEach((manifest) => {
      this.registerManifest(manifest);
    });
  }

  /**
   * Clear all registrations (useful for testing or re-initialization).
   */
  clear(): void {
    this.manifests.clear();
    this.categories.clear();
  }

  /**
   * Get all registered manifests.
   * @returns Array of all node manifests
   */
  getAllManifests(): NodeManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Check if a node type is registered.
   * @param nodeType - Node type identifier
   * @returns True if registered, false otherwise
   */
  has(nodeType: string): boolean {
    return this.manifests.has(nodeType);
  }

  /**
   * Get the count of registered node types.
   * @returns Number of registered node types
   */
  size(): number {
    return this.manifests.size;
  }
}
