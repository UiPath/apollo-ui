import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Braces, Brackets, CircleSlash2, Hash, ToggleLeft, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib';
import type { JsonTreeNodeType, NodeBadgeReference } from './JsonTree.types';
import { JsonTreeTooltip } from './JsonTreeTooltip';
import { useJsonTreeViewStrings } from './strings';

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
  /** Marks the value as a reference: adds a corner tab with an arrow. */
  reference?: NodeBadgeReference;
}

/**
 * Compact badge for a JSON value type. Deliberately neutral: the value text
 * carries the color coding, the badge only carries the type icon. Hovering it
 * shows the type name (override via `tooltip`). A `reference` adds a corner
 * tab with an arrow; it has no hover state of its own, only the tooltip.
 */
export function JsonTypeBadge({ type, icon, className, tooltip, reference }: JsonTypeBadgeProps) {
  const strings = useJsonTreeViewStrings();
  const DefaultIcon = TYPE_ICON[type];
  const box = (
    <span
      className={cn(
        'inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded border border-border bg-surface-overlay px-0.5 text-foreground-muted [&_svg]:size-2.75',
        className
      )}
    >
      {icon ?? <DefaultIcon />}
    </span>
  );

  if (!reference) {
    return (
      <JsonTreeTooltip
        content={
          <span className="break-all font-mono text-xs font-semibold leading-4">
            {tooltip ?? TYPE_LABEL[type]}
          </span>
        }
        placement="top"
        delay
      >
        {box}
      </JsonTreeTooltip>
    );
  }

  const title = strings.referenceType(TYPE_LABEL[type]);
  return (
    <JsonTreeTooltip
      content={
        tooltip ?? (
          <span className="flex flex-col gap-0.5 leading-4">
            <span className="text-xs font-semibold">{title}</span>
            {reference.source && (
              <span className="break-all text-xs text-foreground-muted">{reference.source}</span>
            )}
          </span>
        )
      }
      placement="top"
      delay
    >
      {/* The tab is a sibling of the box so the box's svg sizing does not reach it. */}
      <span
        className="relative inline-flex shrink-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="img"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Focusable so keyboard users can open the tooltip, the only visible place the source appears. It has no action, so it stays an image rather than a button.
        tabIndex={0}
        aria-label={reference.source ? `${title}, ${reference.source}` : title}
      >
        {box}
        <span className="absolute -right-1 -bottom-1 grid size-3 place-items-center rounded-[3px] border border-border bg-surface-overlay text-foreground-muted">
          <ArrowUpRight className="size-2.5" strokeWidth={3} />
        </span>
      </span>
    </JsonTreeTooltip>
  );
}
