import { createContext, useContext, useMemo } from 'react';
import { NodeManifest } from '../schema/node-definition';
import type { NodeTypeRegistry } from './NodeTypeRegistry';

interface NodeRegistryContextValue {
  registry: NodeTypeRegistry;
}

export const NodeRegistryContext = createContext<NodeRegistryContextValue | null>(null);

/**
 * Hook to access the node type registry.
 * @throws {Error} If used outside of NodeRegistryProvider
 * @returns NodeTypeRegistry instance
 */
export const useNodeTypeRegistry = (): NodeTypeRegistry => {
  const context = useContext(NodeRegistryContext);
  if (!context) {
    throw new Error('useNodeTypeRegistry must be used within a NodeRegistryProvider');
  }
  return context.registry;
};

/**
 * Hook to optionally access the node type registry.
 * @returns NodeTypeRegistry instance or null if not available
 */
export const useOptionalNodeTypeRegistry = (): NodeTypeRegistry | null => {
  const context = useContext(NodeRegistryContext);
  return context?.registry ?? null;
};

/**
 * Hook to get all registered node manifests.
 * @returns Array of all node manifests
 */
export const useNodeManifests = (): NodeManifest[] => {
  const registry = useNodeTypeRegistry();
  return useMemo(() => registry.getAllManifests(), [registry]);
};

/**
 * Hook to get a specific node manifest by type.
 * @param nodeType - Node type identifier
 * @returns Node manifest or undefined if not found
 */
export const useNodeManifest = (nodeType: string): NodeManifest | undefined => {
  const registry = useNodeTypeRegistry();
  return useMemo(() => registry.getManifest(nodeType), [registry, nodeType]);
};
