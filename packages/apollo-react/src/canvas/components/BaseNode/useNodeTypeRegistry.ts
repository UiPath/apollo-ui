import { createContext, useContext } from 'react';
import type { NodeRegistration } from './BaseNode.types';
import type { NodeTypeRegistry } from './NodeTypeRegistry';

interface NodeRegistryContextValue {
  registry: NodeTypeRegistry;
}

export const NodeRegistryContext = createContext<NodeRegistryContextValue | null>(null);

export const useNodeTypeRegistry = (): NodeTypeRegistry => {
  const context = useContext(NodeRegistryContext);
  if (!context) {
    throw new Error('useNodeTypeRegistry must be used within a NodeRegistryProvider');
  }
  return context.registry;
};

export const useOptionalNodeTypeRegistry = (): NodeTypeRegistry | null => {
  const context = useContext(NodeRegistryContext);
  return context?.registry ?? null;
};

export const useNodeRegistrations = (): NodeRegistration[] => {
  const registry = useNodeTypeRegistry();
  return registry.getAllRegistrations();
};
