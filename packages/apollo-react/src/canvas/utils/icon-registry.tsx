/* eslint-disable react-refresh/only-export-components -- Registry pattern intentionally exports both components and utility functions */
/**
 * Icon Registry
 *
 * Maps string identifiers to React icon components.
 * Supports both Lucide icons (via DynamicIcon) and UIPath custom icons.
 */

import { icons } from 'lucide-react';
import { type JSX, memo, useMemo } from 'react';
import * as Icons from '../icons';

export type IconComponent = (props: { w?: number; h?: number; color?: string }) => JSX.Element;

/**
 * Registry of available icons (UIPath icons only)
 * Lucide icons are handled dynamically via DynamicIcon
 */
const iconRegistry: Record<string, IconComponent> = {
  // UIPath icons
  agent: ({ w, h }) => <Icons.AgentProject w={w ?? 29} h={h ?? 28} />,
  'coded-agent': ({ w, h }) => <Icons.CodedAgentIcon w={w ?? 29} h={h ?? 28} />,
  connector: ({ w, h }) => <Icons.ConnectorBuilderProject w={w ?? 29} h={h ?? 28} />,
  'data-tools': ({ w, h }) => <Icons.DataAndTools w={w ?? 29} h={h ?? 28} />,
  'control-flow': ({ w, h }) => <Icons.ControlFlowIcon w={w ?? 29} h={h ?? 28} />,
  'human-task': ({ w, h }) => <Icons.WebAppProject w={w ?? 29} h={h ?? 28} />,
  rpa: ({ w, h }) => <Icons.RpaProject w={w ?? 29} h={h ?? 28} />,
  api: ({ w, h }) => <Icons.ApiProject w={w ?? 29} h={h ?? 28} />,
  decision: ({ w, h }) => <Icons.DecisionIcon w={w ?? 24} h={h ?? 24} />,
  switch: ({ w, h }) => <Icons.SwitchIcon w={w ?? 24} h={h ?? 24} />,
  'pinned-output': ({ w, h, color }) => (
    <Icons.FlaskRunIcon w={w ?? 24} h={h ?? 24} color={color} />
  ),
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

function isValidUrl(input: string): boolean {
  let url: URL | undefined;

  try {
    url = new URL(input);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

/**
 * Get an icon component by its identifier
 * Supports:
 * - UIPath icons (e.g., "uipath.agent")
 * - Any Lucide icon by kebab-case name (e.g., "arrow-right", "file-text", "play")
 */
export function getIcon(iconId: string): IconComponent {
  if (isValidUrl(iconId)) {
    return ({ w, h }) => (
      <img
        src={iconId}
        alt="icon"
        style={{
          width: w ?? 24,
          height: h ?? 24,
        }}
      />
    );
  }

  const icon = iconRegistry[iconId];
  if (icon) {
    return icon;
  }

  // Try to get lucide icon - convert kebab-case to PascalCase
  const pascalCaseId = kebabToPascal(iconId);
  const LucideIcon = (
    icons as Record<
      string,
      React.ComponentType<{ width?: number; height?: number; color?: string }>
    >
  )[pascalCaseId];
  if (LucideIcon) {
    return ({ w, h, color }) => <LucideIcon width={w ?? 24} height={h ?? 24} color={color} />;
  }

  // Fallback to box icon
  const BoxIcon = icons.Box;
  return ({ w, h, color }) => <BoxIcon width={w ?? 24} height={h ?? 24} color={color} />;
}

export interface NodeIconProps {
  icon?: string;
  size?: number;
  color?: string;
}

/**
 * Memoized component for rendering icons from the registry
 * Use this instead of getIcon() to avoid creating components during render
 */
export const NodeIcon = memo(function NodeIcon({ icon, size = 16, color }: NodeIconProps) {
  const Icon = useMemo(() => (icon ? getIcon(icon) : null), [icon]);
  if (!Icon) return null;
  return <Icon w={size} h={size} color={color} />;
});
