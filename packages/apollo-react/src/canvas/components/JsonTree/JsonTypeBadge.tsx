import { cn } from '@uipath/apollo-wind';
import type { LucideIcon } from 'lucide-react';
import { Braces, Brackets, CircleSlash2, Hash, ToggleLeft, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import { CanvasTooltip } from '../CanvasTooltip';
import type { JsonTreeNodeType } from './JsonTree.types';

const TYPE_ICON: Record<JsonTreeNodeType, LucideIcon> = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  object: Braces,
  array: Brackets,
  null: CircleSlash2,
};

// Capitalized JSON type name shown in the badge tooltip. A technical token
// (like the monospace paths/ids), so it is intentionally not localized.
const TYPE_LABEL: Record<JsonTreeNodeType, string> = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  object: 'Object',
  array: 'Array',
  null: 'Null',
};

export interface JsonTypeBadgeProps {
  type: JsonTreeNodeType;
  /** Replaces the default type icon (e.g. a paperclip for file nodes). */
  icon?: ReactNode;
  /** Color/chrome overrides (e.g. from a node decoration). */
  className?: string;
  /** Tooltip content on hover. Defaults to the capitalized type name. */
  tooltip?: ReactNode;
}

/**
 * Compact badge for a JSON value type. Deliberately neutral: the value text
 * carries the color coding, the badge only carries the type icon. Hovering it
 * shows the type name (override via `tooltip`).
 */
export function JsonTypeBadge({ type, icon, className, tooltip }: JsonTypeBadgeProps) {
  const DefaultIcon = TYPE_ICON[type];
  return (
    <CanvasTooltip
      content={
        <span className="break-all font-mono text-xs font-semibold leading-4">
          {tooltip ?? TYPE_LABEL[type]}
        </span>
      }
      placement="top"
      delay
    >
      <span
        className={cn(
          'inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded border border-border bg-surface-overlay px-0.5 text-foreground-muted [&_svg]:size-2.75',
          className
        )}
      >
        {icon ?? <DefaultIcon />}
      </span>
    </CanvasTooltip>
  );
}
