// import { isValidElement } from "react";

import type { NodeItemData } from "../AddNodePanel/AddNodePanel.types";
import type { ListItem } from "../Toolbox";
import type { BaseNodeData, NodeRegistration, NodeTypeDefinition } from "./BaseNode.types";

export class NodeTypeRegistry {
  private definitions = new Map<string, NodeTypeDefinition>();
  private allDefinitions = new Map<string, NodeTypeDefinition>();
  private metadata = new Map<string, Omit<NodeRegistration, "definition">>();
  private categories = new Map<string, string[]>();

  register(registration: NodeRegistration) {
    const { definition, ...metadata } = registration;
    const nodeType = registration.nodeType;
    const subType = registration.subType;

    this.definitions.set(nodeType, definition);
    this.metadata.set(nodeType, metadata);
    this.allDefinitions.set(subType ?? nodeType, definition);

    const category = metadata.category || "misc";
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(nodeType);
  }

  get(nodeType: string): NodeTypeDefinition | undefined {
    return this.definitions.get(nodeType);
  }

  getBySubType(subType: string): NodeTypeDefinition | undefined {
    return this.allDefinitions.get(subType);
  }

  getMetadata(nodeType: string) {
    return this.metadata.get(nodeType);
  }

  getByCategory(category: string): string[] {
    return this.categories.get(category) || [];
  }

  getAllCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  getAllNodeTypes(): string[] {
    return Array.from(this.definitions.keys());
  }

  createDefaultData(nodeType: string, label?: string): BaseNodeData {
    const definition = this.getBySubType(nodeType);
    const metadata = this.getMetadata(nodeType);

    return {
      nodeType,
      version: metadata?.version || "1.0.0",
      parameters: definition?.getDefaultParameters?.() ?? {},
      display: {
        label: label || nodeType,
      },
    };
  }

  /**
   * Get node options for AddNodePanel
   * @param category - Filter by category (optional)
   * @param search - Search term for filtering (optional)
   * @returns Array of NodeOption objects
   */
  getNodeOptions(category?: string, search?: string): ListItem<NodeItemData>[] {
    const options: ListItem<NodeItemData>[] = [];

    for (const [nodeType, metadata] of this.metadata.entries()) {
      // Skip hidden nodes
      if (metadata.isVisible === false) continue;

      // Filter by category if specified
      if (category && category !== "all" && metadata.category !== category) continue;

      // Filter by search term if specified
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = metadata.displayName?.toLowerCase().includes(searchLower);
        const matchesType = nodeType.toLowerCase().includes(searchLower);
        const matchesDescription = metadata.description?.toLowerCase().includes(searchLower);
        const matchesTags = metadata.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesName && !matchesType && !matchesDescription && !matchesTags) continue;
      }

      // // Convert icon to string if it's a React element
      // let iconName: string | undefined;
      // if (typeof metadata.icon === "string") {
      //   iconName = metadata.icon;
      // } else if (isValidElement(metadata.icon)) {
      //   // Extract icon name from React element if possible
      //   // This is a simplified approach - you might need to adjust based on your icon components
      //   iconName = metadata.icon.name || undefined;
      // }

      options.push({
        id: nodeType,
        name: metadata.displayName || nodeType,
        // FIXME: we need this to be serializable so no React.FC
        icon: typeof metadata.icon === "string" ? { name: metadata.icon } : { Component: metadata.icon },
        description: metadata.description,
        data: {
          type: nodeType,
          category: metadata.category || "misc",
          version: metadata.version,
        },
      });
    }

    // Sort by sortOrder, then by label
    options.sort((a, b) => {
      const aMetadata = this.metadata.get(a.id);
      const bMetadata = this.metadata.get(b.id);
      const aOrder = aMetadata?.sortOrder ?? 999;
      const bOrder = bMetadata?.sortOrder ?? 999;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });

    return options;
  }

  /**
   * Search for node types
   * @param query - Search query
   * @returns Array of matching node types
   */
  searchNodeTypes(query: string): string[] {
    const searchLower = query.toLowerCase();
    const matches: string[] = [];

    for (const [nodeType, metadata] of this.metadata.entries()) {
      if (metadata.isVisible === false) continue;

      const matchesName = metadata.displayName?.toLowerCase().includes(searchLower);
      const matchesType = nodeType.toLowerCase().includes(searchLower);
      const matchesDescription = metadata.description?.toLowerCase().includes(searchLower);
      const matchesTags = metadata.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

      if (matchesName || matchesType || matchesDescription || matchesTags) {
        matches.push(nodeType);
      }
    }

    return matches;
  }

  /**
   * Get category configuration for AddNodePanel
   * @returns Array of NodeCategory objects with metadata
   */
  getCategoryConfig(): ListItem[] {
    // Get unique categories from registered nodes
    const categoriesMap = new Map<string, ListItem>();

    for (const [_nodeType, metadata] of this.metadata.entries()) {
      if (metadata.isVisible !== false && metadata.category) {
        const categoryId = metadata.category;

        // Only add category if not already in map
        if (!categoriesMap.has(categoryId)) {
          // Use metadata from the first node of this category for icon/color hints
          const categoryMeta: ListItem = {
            id: categoryId,
            name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
            icon: typeof metadata.icon === "string" ? { name: metadata.icon } : { Component: metadata.icon },
            data: null,
          };

          categoriesMap.set(categoryId, categoryMeta);
        }
      }
    }

    // Convert to array and sort by registration order (maintains insertion order)
    return Array.from(categoriesMap.values());
  }

  /**
   * Register multiple node types at once
   */
  registerAll(registrations: NodeRegistration[]): void {
    registrations.forEach((registration) => this.register(registration));
  }

  /**
   * Clear all registrations (useful for testing or re-initialization)
   */
  clear(): void {
    this.definitions.clear();
    this.allDefinitions.clear();
    this.metadata.clear();
    this.categories.clear();
  }

  /**
   * Get all registrations
   */
  getAllRegistrations(): NodeRegistration[] {
    const registrations: NodeRegistration[] = [];
    for (const [nodeType, metadata] of this.metadata.entries()) {
      const definition = this.definitions.get(nodeType);
      if (definition) {
        registrations.push({
          ...metadata,
          nodeType,
          definition,
        });
      }
    }
    return registrations;
  }
}
