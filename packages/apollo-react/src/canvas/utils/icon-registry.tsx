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

export type IconComponent = (props: {
  w?: number;
  h?: number;
  color?: string;
  fill?: string;
}) => JSX.Element;

/**
 * Registry of available icons (UIPath icons only)
 * Lucide icons are handled dynamically via DynamicIcon
 */
const iconRegistry: Record<string, IconComponent> = {
  // UIPath icons
  agent: ({ w, h }) => <Icons.AgentProject w={w ?? 29} h={h ?? 28} />,
  'autonomous-agent': ({ w, h }) => <Icons.AutonomousAgentIcon w={w ?? 29} h={h ?? 28} />,
  'conversational-agent': ({ w, h }) => <Icons.ConversationalAgentIcon w={w ?? 29} h={h ?? 28} />,
  'coded-agent': ({ w, h }) => <Icons.CodedAgentIcon w={w ?? 29} h={h ?? 28} />,
  connector: ({ w, h }) => <Icons.ConnectorBuilderProject w={w ?? 29} h={h ?? 28} />,
  'data-tools': ({ w, h }) => <Icons.DataAndTools w={w ?? 29} h={h ?? 28} />,
  'control-flow': ({ w, h }) => <Icons.ControlFlowIcon w={w ?? 29} h={h ?? 28} />,
  'human-task': ({ w, h }) => <Icons.WebAppProject w={w ?? 29} h={h ?? 28} />,
  rpa: ({ w, h }) => <Icons.RpaProject w={w ?? 29} h={h ?? 28} />,
  api: ({ w, h }) => <Icons.ApiProject w={w ?? 29} h={h ?? 28} />,
  'agentic-process': ({ w, h }) => <Icons.BusinessProcessProject w={w ?? 29} h={h ?? 28} />,
  'flow-project': ({ w, h }) => <Icons.FlowProject w={w ?? 29} h={h ?? 28} />,
  'case-management': ({ w, h }) => <Icons.CaseManagementProject w={w ?? 29} h={h ?? 28} />,
  decision: ({ w, h }) => <Icons.DecisionIcon w={w ?? 24} h={h ?? 24} />,
  'layers-arrow-up-right': ({ w, h }) => <Icons.LayersArrowUpRightIcon w={w ?? 24} h={h ?? 24} />,
  switch: ({ w, h }) => <Icons.SwitchIcon w={w ?? 24} h={h ?? 24} />,
  uipath: ({ w, h }) => <Icons.UiPathIcon w={w ?? 24} h={h ?? 24} />,
  'agent-diagram': ({ w, h }) => <Icons.AgentDiagramIcon w={w ?? 24} h={h ?? 24} />,
  function: ({ w, h }) => <Icons.FunctionProject w={w ?? 29} h={h ?? 28} />,
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
 * Get an icon component by its identifier. Supports UIPath icons
 * (e.g. "uipath.agent") and Lucide kebab-case names (e.g. "arrow-right").
 * Falls back to the Box icon when `iconId` is missing or unrecognized.
 */
export function getIcon(iconId?: string): IconComponent {
  if (!iconId) {
    const BoxIcon = icons.Box;
    return ({ w, h, color }) => <BoxIcon width={w ?? 24} height={h ?? 24} color={color} />;
  }

  if (isValidUrl(iconId)) {
    return ({ w, h }) => (
      <img
        src={iconId}
        alt="icon"
        style={{
          width: w,
          height: h,
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
      React.ComponentType<{ width?: number; height?: number; color?: string; fill?: string }>
    >
  )[pascalCaseId];
  if (LucideIcon) {
    return ({ w, h, color, fill }) => (
      <LucideIcon width={w ?? 24} height={h ?? 24} color={color} {...(fill?.length && { fill })} />
    );
  }

  // Fallback to box icon
  const BoxIcon = icons.Box;
  return ({ w, h, color }) => <BoxIcon width={w ?? 24} height={h ?? 24} color={color} />;
}

export interface CanvasIconProps {
  icon?: string;
  size?: number;
  color?: string;
  fill?: string;
}

/**
 * Memoized component for rendering icons from the registry.
 * Use this instead of getIcon() to avoid creating components during render.
 */
export const CanvasIcon = memo(function CanvasIcon({
  icon,
  size = 16,
  color,
  fill,
}: CanvasIconProps) {
  const Icon = useMemo(() => (icon ? getIcon(icon) : null), [icon]);
  if (!Icon) return null;
  return <Icon w={size} h={size} color={color} fill={fill} />;
});

/** @deprecated Use `CanvasIcon` instead. */
export const NodeIcon = CanvasIcon;
