import { ReactNode, useMemo, useContext, createContext } from "react";
import { NodeRegistration } from "./BaseNode.types";
import { NodeTypeRegistry } from "./NodeTypeRegistry";

interface NodeRegistryContextValue {
  registry: NodeTypeRegistry;
}

const NodeRegistryContext = createContext<NodeRegistryContextValue | null>(null);

interface NodeRegistryProviderProps {
  children: ReactNode;
  registrations?: NodeRegistration[];
  onRegistration?: (nodeType: string, success: boolean) => void;
}

export const NodeRegistryProvider: React.FC<NodeRegistryProviderProps> = ({ children, registrations = [] }) => {
  const registry = useMemo(() => {
    const reg = new NodeTypeRegistry();
    registrations.forEach((registration) => reg.register(registration));
    return reg;
  }, [registrations]);

  const contextValue = useMemo(() => ({ registry }), [registry]);

  return <NodeRegistryContext.Provider value={contextValue}>{children}</NodeRegistryContext.Provider>;
};

export const useNodeTypeRegistry = (): NodeTypeRegistry => {
  const context = useContext(NodeRegistryContext);
  if (!context) {
    throw new Error("useNodeRegistry must be used within a NodeRegistryProvider");
  }
  return context.registry;
};
