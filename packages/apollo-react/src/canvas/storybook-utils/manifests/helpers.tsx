import * as Icons from '@uipath/apollo-react/canvas/icons';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { icons } from 'lucide-react';
import type React from 'react';
import type { ReactElement } from 'react';
import type { BaseNodeData, HandleConfiguration } from '../../components/BaseNode/BaseNode.types';
import type { ManifestHandleGroup } from './types';

export type IconComponent = (props: { w?: number; h?: number }) => ReactElement;

/**
 * Registry of available icons (UIPath icons only)
 * Lucide icons are handled dynamically via DynamicIcon
 */
const iconRegistry: Record<string, IconComponent> = {
  // UIPath icons
  'uipath.agent': ({ w, h }) => <Icons.AgentProject w={w ?? 29} h={h ?? 28} />,
  'uipath.connector': ({ w, h }) => <Icons.ConnectorBuilderProject w={w ?? 29} h={h ?? 28} />,
  'uipath.data-tools': ({ w, h }) => <Icons.DataAndTools w={w ?? 29} h={h ?? 28} />,
  'uipath.control-flow': ({ w, h }) => <Icons.ControlFlowIcon w={w ?? 29} h={h ?? 28} />,
  'uipath.human-task': ({ w, h }) => <Icons.WebAppProject w={w ?? 29} h={h ?? 28} />,
  'uipath.rpa': ({ w, h }) => <Icons.RpaProject w={w ?? 29} h={h ?? 28} />,
  'uipath.api': ({ w, h }) => <Icons.ApiProject w={w ?? 29} h={h ?? 28} />,
  'uipath.decision': ({ w, h }) => <Icons.DecisionIcon w={w ?? 24} h={h ?? 24} />,
  'uipath.switch': ({ w, h }) => <Icons.SwitchIcon w={w ?? 24} h={h ?? 24} />,
};

/**
 * Convert kebab-case to PascalCase
 * e.g., "arrow-right" -> "ArrowRight", "trash" -> "Trash"
 */
function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Get an icon component by its identifier
 * Supports:
 * - UIPath icons (e.g., "uipath.agent")
 * - Any Lucide icon by kebab-case name (e.g., "arrow-right", "file-text", "play")
 */
export function getIcon(iconId: string): IconComponent {
  const icon = iconRegistry[iconId];
  if (icon) {
    return icon;
  }

  // Try to get lucide icon - convert kebab-case to PascalCase
  const pascalCaseId = kebabToPascal(iconId);
  const LucideIcon = (
    icons as Record<string, React.ComponentType<{ width?: number; height?: number }>>
  )[pascalCaseId];
  if (LucideIcon) {
    return ({ w, h }) => <LucideIcon width={w ?? 24} height={h ?? 24} />;
  }

  // Fallback to box icon
  const BoxIcon = icons.Box;
  return ({ w, h }) => <BoxIcon width={w ?? 24} height={h ?? 24} />;
}

/**
 * Position string to React Flow Position enum mapping.
 */
const positionToEnum: Record<ManifestHandleGroup['position'], Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

/**
 * Resolves manifest handle groups to HandleConfiguration array.
 *
 * @param manifestHandles - Handle groups from manifest
 * @param data - Node data for dynamic handle resolution
 * @param overrides - Optional handle overrides from node data
 * @returns HandleConfiguration array for React Flow
 */
export function resolveHandleGroups(
  manifestHandles: ManifestHandleGroup[] | undefined,
  data: BaseNodeData,
  overrides?: HandleConfiguration[]
): HandleConfiguration[] {
  // If node data has handle configurations, use those instead
  if (data.handleConfigurations && Array.isArray(data.handleConfigurations)) {
    return data.handleConfigurations;
  }

  // If overrides provided, merge with manifest handles
  if (overrides) {
    return overrides;
  }

  // No handles defined
  if (!manifestHandles) {
    return [];
  }

  // Convert manifest handles to HandleConfiguration
  return manifestHandles.map((group) => ({
    position: positionToEnum[group.position],
    visible: group.visible ?? true,
    handles: group.handles.map((handle) => ({
      id: handle.id,
      type: handle.type,
      handleType: handle.handleType,
      label: handle.label,
      showButton: handle.type === 'source',
    })),
  }));
}
