/**
 * Slot Resolver
 *
 * Converts serializable slot configurations to React elements at render time.
 * This is the bridge between the data layer (slot configs) and the UI layer (React components).
 *
 * Mirrors the pattern used in toolbar-resolver.tsx:
 * - Declarative configs in data (JSON-serializable)
 * - Runtime resolution to React components
 */

import type { SlotConfig } from '../schema/slot-config';
import type { SlotRegistry, SlotRenderContext } from '../core/SlotRegistry';
import { getIcon } from './icon-registry';
import { ExecutionStatusIcon } from '../components/ExecutionStatusIcon/ExecutionStatusIcon';

/**
 * Simple Badge component for BadgeSlotConfig
 * Can be replaced with a more sophisticated component later
 */
function Badge({
  iconId,
  label,
  variant = 'neutral',
  interactive = false,
  onClick,
}: {
  iconId?: string;
  label?: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  interactive?: boolean;
  onClick?: () => void;
}) {
  const variantColors: Record<string, string> = {
    success: 'var(--uix-canvas-success-icon, #10b981)',
    error: 'var(--uix-canvas-error-icon, #ef4444)',
    warning: 'var(--uix-canvas-warning-icon, #f59e0b)',
    info: 'var(--uix-canvas-info-icon, #3b82f6)',
    neutral: 'var(--uix-canvas-foreground-de-emp, #6b7280)',
  };

  const color = variantColors[variant];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: interactive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
        cursor: interactive ? 'pointer' : 'default',
        color,
      }}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {iconId &&
        (() => {
          const IconComponent = getIcon(iconId);
          return <IconComponent w={14} h={14} />;
        })()}
      {label && <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>}
    </div>
  );
}

/**
 * Resolve a slot configuration to a React element
 *
 * @param config The slot configuration (or undefined)
 * @param context Runtime context for the slot (node state, selection, etc.)
 * @param registry Registry for custom renderers and event handlers
 * @returns A React element, or null if config is undefined
 */
export function resolveSlot(
  config: SlotConfig | undefined,
  context: SlotRenderContext,
  registry: SlotRegistry
): React.ReactNode {
  if (!config) return null;

  switch (config.type) {
    case 'icon': {
      const IconComponent = getIcon(config.iconId);
      return <IconComponent w={config.size ?? 24} h={config.size ?? 24} />;
    }

    case 'text': {
      const fontWeights: Record<string, number> = {
        normal: 400,
        medium: 500,
        bold: 700,
      };

      return (
        <span
          style={{
            color: config.color,
            fontWeight: config.weight ? fontWeights[config.weight] : undefined,
            fontSize:
              config.variant === 'caption' ? 12 : config.variant === 'label' ? 14 : undefined,
          }}
        >
          {config.content}
        </span>
      );
    }

    case 'badge': {
      const onClick = config.onClick
        ? () => {
            const handler = registry.getEventHandler(config.onClick!);
            if (handler) {
              handler(context);
            } else {
              console.warn(`Event handler "${config.onClick}" not found in registry`);
            }
          }
        : undefined;

      return (
        <Badge
          iconId={config.iconId}
          label={config.label}
          variant={config.variant}
          interactive={config.interactive}
          onClick={onClick}
        />
      );
    }

    case 'status-icon': {
      return <ExecutionStatusIcon status={config.status} size={config.size ?? 16} />;
    }

    case 'custom': {
      const renderer = registry.getRenderer(config.slotId);
      if (!renderer) {
        console.warn(`Slot renderer "${config.slotId}" not found in registry`);
        return null;
      }
      return renderer(config, context);
    }

    case 'composite': {
      const flexDirection = config.layout === 'horizontal' ? 'row' : 'column';
      return (
        <div
          style={{
            display: 'flex',
            flexDirection,
            gap: config.spacing ?? 4,
            alignItems: config.layout === 'horizontal' ? 'center' : 'stretch',
          }}
        >
          {config.slots.map((slot, idx) => (
            <div key={idx}>{resolveSlot(slot, context, registry)}</div>
          ))}
        </div>
      );
    }

    default: {
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustiveCheck: never = config;
      console.warn('Unknown slot config type:', _exhaustiveCheck);
      return null;
    }
  }
}
