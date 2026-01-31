import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { NodeManifest, WorkflowManifest } from '../schema/node-definition';
import { NodeTypeRegistry } from './NodeTypeRegistry';
import { NodeRegistryContext } from './useNodeTypeRegistry';

interface NodeRegistryProviderProps {
  children: ReactNode;
  /**
   * Optional list of node manifests to register nodes only. Categories will be implicitly registered based on node config. When changed, will overwrite previous registrations.
   */
  registrations?: NodeManifest[];
  /**
   * Full manifest to register both nodes and categories. When changed, will overwrite previous registrations.
   */
  manifest?: WorkflowManifest;
  onRegistration?: (nodeType: string, success: boolean) => void;
}

export const NodeRegistryProvider: React.FC<NodeRegistryProviderProps> = ({
  children,
  manifest,
  registrations,
}) => {
  const registry = useMemo(() => {
    const reg = new NodeTypeRegistry();
    if (manifest) {
      reg.registerManifest(manifest);
    } else if (registrations) {
      reg.registerNodeManifests(registrations);
    }
    return reg;
  }, [manifest, registrations]);

  const contextValue = useMemo(() => ({ registry }), [registry]);

  return (
    <NodeRegistryContext.Provider value={contextValue}>{children}</NodeRegistryContext.Provider>
  );
};
