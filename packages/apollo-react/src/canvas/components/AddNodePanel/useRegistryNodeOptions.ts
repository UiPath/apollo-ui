import { useCallback } from "react";
import { useNodeTypeRegistry } from "../BaseNode/NodeRegistryProvider";
import type { NodeOption } from "./AddNodePanel.types";

/**
 * Hook that provides node options from the NodeTypeRegistry
 * This allows AddNodePanel to use registered node types as its source
 */
export function useRegistryNodeOptions() {
  const registry = useNodeTypeRegistry();

  /**
   * Fetch node options from the registry
   * @param category - Optional category filter
   * @param search - Optional search term
   * @returns Promise resolving to array of NodeOption
   */
  const fetchNodeOptions = useCallback(
    async (category?: string, search?: string): Promise<NodeOption[]> => {
      return registry.getNodeOptions(category, search);
    },
    [registry]
  );

  /**
   * Get all available categories from the registry with metadata
   */
  const getCategories = useCallback(() => {
    return registry.getCategoryConfig();
  }, [registry]);

  /**
   * Create node data for a selected node type
   */
  const createNodeData = useCallback(
    (nodeType: string) => {
      return registry.createDefaultData(nodeType);
    },
    [registry]
  );

  return {
    fetchNodeOptions,
    getCategories,
    createNodeData,
  };
}

/**
 * Hook that safely gets registry options if available
 * Returns null if not in a NodeRegistryProvider
 */
export function useOptionalRegistryNodeOptions() {
  try {
    const registry = useNodeTypeRegistry();

    const fetchNodeOptions = useCallback(
      async (category?: string, search?: string): Promise<NodeOption[]> => {
        return registry.getNodeOptions(category, search);
      },
      [registry]
    );

    const getCategories = useCallback(() => {
      return registry.getCategoryConfig();
    }, [registry]);

    const createNodeData = useCallback(
      (nodeType: string) => {
        return registry.createDefaultData(nodeType);
      },
      [registry]
    );

    return {
      fetchNodeOptions,
      getCategories,
      createNodeData,
    };
  } catch {
    // Not in a registry provider
    return null;
  }
}
