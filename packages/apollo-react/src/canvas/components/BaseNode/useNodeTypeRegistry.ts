import { useContext, createContext } from "react";
import { NodeTypeRegistry } from "./NodeTypeRegistry";

interface NodeRegistryContextValue {
  registry: NodeTypeRegistry;
}

export const NodeRegistryContext = createContext<NodeRegistryContextValue>({ registry: new NodeTypeRegistry() });

export const useNodeTypeRegistry = (): NodeTypeRegistry => {
  const context = useContext(NodeRegistryContext);
  return context.registry;
};
