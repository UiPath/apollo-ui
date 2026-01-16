import type { NodeRegistration } from '../../components/BaseNode/BaseNode.types';
import { ExecutionStatusIcon } from '../../components/ExecutionStatusIcon';
import type { ExecutionStatusWithCount } from '../../types/execution';
import { getIcon, resolveHandleGroups } from './helpers';
import type { NodeManifest } from './types';

/**
 * Creates a NodeRegistration from a declarative manifest.
 *
 * This factory function converts JSON-serializable manifest configuration
 * into a fully functional NodeRegistration with React components and handlers.
 *
 * @param manifest - The declarative node manifest
 * @returns A complete NodeRegistration object
 */
export function createNodeFromManifest(manifest: NodeManifest): NodeRegistration {
  const IconComponent = getIcon(manifest.display.icon);

  return {
    // Core identification
    nodeType: manifest.nodeType,
    version: manifest.version,
    displayName: manifest.display.label,

    // Categorization
    category: manifest.category,
    description: manifest.description,
    tags: manifest.tags,
    sortOrder: manifest.sortOrder,
    isVisible: manifest.isVisible,

    // Icon for palette display
    icon: () => <IconComponent />,

    // Node type definition with render functions
    definition: {
      getIcon: (data, _context) => {
        if (typeof data.display?.icon === 'function') {
          return data.display.icon;
        }
        const Icon = getIcon(data.display?.icon ?? manifest.display.icon);
        return <Icon />;
      },

      getDisplay: (data, _context) => ({
        label: data.display?.label ?? manifest.display.label,
        subLabel: data.display?.subLabel ?? manifest.display.subLabel,
        shape: data.display?.shape ?? manifest.display.shape,
        color: data.display?.color ?? manifest.display.color,
        background: data.display?.background ?? manifest.display.background,
        iconBackground: data.display?.iconBackground ?? manifest.display.iconBackground,
        iconColor: data.display?.iconColor ?? manifest.display.iconColor,
      }),

      getAdornments: (_data, context) => {
        const status =
          (context.executionState as ExecutionStatusWithCount)?.status ?? context.executionState;

        return {
          topRight: <ExecutionStatusIcon status={status as string | undefined} />,
        };
      },

      getHandleConfigurations: (data, _context) => {
        return resolveHandleGroups(manifest.handles, data, undefined);
      },
    },
  };
}

/**
 * Creates multiple NodeRegistrations from an array of manifests.
 *
 * @param manifests - Array of node manifests
 * @returns Array of NodeRegistration objects
 */
export function createNodesFromManifests(manifests: NodeManifest[]): NodeRegistration[] {
  return manifests.map(createNodeFromManifest);
}
