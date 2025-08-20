import { useContext, createContext } from "react";
import type { NodeTypeRegistry } from "./NodeTypeRegistry";

interface NodeRegistryContextValue {
  registry: NodeTypeRegistry;
}

export const NodeRegistryContext = createContext<NodeRegistryContextValue | null>(null);

export const useNodeTypeRegistry = (): NodeTypeRegistry => {
  const context = useContext(NodeRegistryContext);
  if (!context) {
    throw new Error("useNodeRegistry must be used within a NodeRegistryProvider");
  }
  return context.registry;
};
