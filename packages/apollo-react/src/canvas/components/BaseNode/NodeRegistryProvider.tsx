import type { ReactNode } from "react";
import { useMemo } from "react";
import type { NodeRegistration } from "./BaseNode.types";
import { NodeTypeRegistry } from "./NodeTypeRegistry";
import { NodeRegistryContext } from "./useNodeTypeRegistry";

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
