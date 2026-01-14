import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { NodeManifest } from '../../schema/node-definition/node-manifest';
import { NodeTypeRegistry } from './NodeTypeRegistry';
import { NodeRegistryContext } from './useNodeTypeRegistry';

interface NodeRegistryProviderProps {
  children: ReactNode;
  registrations?: NodeManifest[];
  onRegistration?: (nodeType: string, success: boolean) => void;
}

export const NodeRegistryProvider: React.FC<NodeRegistryProviderProps> = ({
  children,
  registrations = [],
}) => {
  const registry = useMemo(() => {
    const reg = new NodeTypeRegistry();
    registrations.forEach((manifest) => reg.registerManifest(manifest));
    return reg;
  }, [registrations]);

  const contextValue = useMemo(() => ({ registry }), [registry]);

  return (
    <NodeRegistryContext.Provider value={contextValue}>{children}</NodeRegistryContext.Provider>
  );
};
