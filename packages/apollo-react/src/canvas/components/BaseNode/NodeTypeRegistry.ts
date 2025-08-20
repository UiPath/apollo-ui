import type { BaseNodeData, NodeRegistration, NodeTypeDefinition } from "./BaseNode.types";
import type { NodeOption, NodeCategory } from "../AddNodePanel/AddNodePanel.types";
import { isValidElement } from "react";

export class NodeTypeRegistry {
  private definitions = new Map<string, NodeTypeDefinition>();
  private metadata = new Map<string, Omit<NodeRegistration, "definition">>();
  private categories = new Map<string, string[]>();

  register(registration: NodeRegistration) {
    const { definition, ...metadata } = registration;
    const nodeType = registration.nodeType;

    this.definitions.set(nodeType, definition);
    this.metadata.set(nodeType, metadata);

    const category = metadata.category || "misc";
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(nodeType);
  }

  get(nodeType: string): NodeTypeDefinition | undefined {
    return this.definitions.get(nodeType);
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

  createDefaultData(nodeType: string): BaseNodeData {
    const definition = this.get(nodeType);
    const metadata = this.getMetadata(nodeType);

    return {
      nodeType,
      version: metadata?.version || "1.0.0",
      parameters: definition?.getDefaultParameters?.() ?? {},
      display: {
        label: metadata?.displayName || nodeType,
      },
    };
  }

  /**
   * Get node options for AddNodePanel
   * @param category - Filter by category (optional)
   * @param search - Search term for filtering (optional)
   * @returns Array of NodeOption objects
   */
  getNodeOptions(category?: string, search?: string): NodeOption[] {
    const options: NodeOption[] = [];

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

      // Convert icon to string if it's a React element
      let iconName: string | undefined;
      if (typeof metadata.icon === "string") {
        iconName = metadata.icon;
      } else if (isValidElement(metadata.icon)) {
        // Extract icon name from React element if possible
        // This is a simplified approach - you might need to adjust based on your icon components
        iconName = metadata.icon.props?.name || undefined;
      }

      options.push({
        id: nodeType,
        type: nodeType,
        label: metadata.displayName || nodeType,
        icon: iconName,
        category: metadata.category || "misc",
        description: metadata.description,
      });
    }

    // Sort by sortOrder, then by label
    options.sort((a, b) => {
      const aMetadata = this.metadata.get(a.type);
      const bMetadata = this.metadata.get(b.type);
      const aOrder = aMetadata?.sortOrder ?? 999;
      const bOrder = bMetadata?.sortOrder ?? 999;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.label.localeCompare(b.label);
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
  getCategoryConfig(): NodeCategory[] {
    // Define category metadata with icons and colors
    const categoryMetadata: Record<string, { label: string; icon: string; color: string }> = {
      triggers: { label: "Triggers", icon: "electric_bolt", color: "#E3F2FD" },
      actions: { label: "Actions", icon: "settings", color: "#F3E5F5" },
      ai: { label: "AI Tools", icon: "smart_toy", color: "#E8F5E9" },
      data: { label: "Data", icon: "filter_alt", color: "#FFF3E0" },
      logic: { label: "Logic", icon: "account_tree", color: "#FCE4EC" },
      integrations: { label: "Integrations", icon: "extension", color: "#E0F2F1" },
    };

    // Get unique categories from registered nodes
    const activeCategories = new Set<string>();
    for (const metadata of this.metadata.values()) {
      if (metadata.isVisible !== false && metadata.category) {
        activeCategories.add(metadata.category);
      }
    }

    // Build category list with metadata
    const categories: NodeCategory[] = [];
    for (const categoryId of activeCategories) {
      const meta = categoryMetadata[categoryId];
      if (meta) {
        categories.push({
          id: categoryId,
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
        });
      } else {
        // Fallback for unknown categories
        categories.push({
          id: categoryId,
          label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          icon: "folder",
        });
      }
    }

    // Sort categories by a predefined order
    const categoryOrder = ["triggers", "actions", "ai", "data", "logic", "integrations"];
    categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.id);
      const bIndex = categoryOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return categories;
  }
}
