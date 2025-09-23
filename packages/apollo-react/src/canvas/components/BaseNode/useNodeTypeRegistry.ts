import { useContext, createContext } from "react";
import { NodeTypeRegistry } from "./NodeTypeRegistry";
import type { NodeRegistration } from "./BaseNode.types";

interface NodeRegistryContextValue {
  registry: NodeTypeRegistry;
}

export const NodeRegistryContext = createContext<NodeRegistryContextValue>({ registry: new NodeTypeRegistry() });

export const useNodeTypeRegistry = (): NodeTypeRegistry => {
  const context = useContext(NodeRegistryContext);
  return context.registry;
};

export const useNodeRegistrations = (): NodeRegistration[] => {
  const registry = useNodeTypeRegistry();
  return registry.getAllRegistrations();
};
