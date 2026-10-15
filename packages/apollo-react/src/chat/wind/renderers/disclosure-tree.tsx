import { cn, Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from '@uipath/apollo-wind';
import { ChevronRight } from 'lucide-react';
import React from 'react';

export interface DisclosureTreeItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Shown as a tooltip on the row, as Material does; no tooltip without one. */
  description?: string;
  /** Right-aligned secondary text. */
  trailing?: React.ReactNode;
  labelStyle?: React.CSSProperties;
  defaultOpen?: boolean;
  /** The children, or a function that builds them when the row first opens. */
  children?: readonly DisclosureTreeItem[] | (() => readonly DisclosureTreeItem[]);
  /** Whether the row has children; required when `children` is a function. */
  expandable?: boolean;
}

/** Row open state held by the caller, so it survives the tree unmounting. */
export interface DisclosureTreeOpenState {
  isOpen: (id: string) => boolean;
  setOpen: (id: string, open: boolean) => void;
}

// The tool call section toggle's treatment (apollo-wind `ToolCallSection`), which needs a
// `ToolCall` around it, so a tree message reads as the same kind of drill-down.
const ROW_CLASSES =
  'flex w-full min-w-0 items-center gap-2 rounded p-1 text-left transition-colors motion-reduce:transition-none';
const FOCUS_CLASSES = 'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring';
const TOGGLE_CLASSES = cn('cursor-pointer hover:text-foreground', FOCUS_CLASSES);

/**
 * A nested list whose parent rows disclose their children, for agent traces and tree messages,
 * styled like the tool call's sections. Each parent row is a button with `aria-expanded`;
 * children render only while open, indented under the row's label. Pass `openState` to keep
 * which rows are open outside the tree.
 */
export function DisclosureTree({
  items,
  openState,
  className,
}: {
  items: readonly DisclosureTreeItem[];
  openState?: DisclosureTreeOpenState;
  className?: string;
}) {
  return (
    <ul data-slot="wind-chat-disclosure-tree" className={cn('flex min-w-0 flex-col', className)}>
      {items.map((item) => (
        <DisclosureTreeRow key={item.id} item={item} openState={openState} />
      ))}
    </ul>
  );
}

function DisclosureTreeRow({
  item,
  openState,
}: {
  item: DisclosureTreeItem;
  openState?: DisclosureTreeOpenState;
}) {
  const [localOpen, setLocalOpen] = React.useState(item.defaultOpen ?? false);
  const open = openState ? openState.isOpen(item.id) : localOpen;
  const setOpen = (next: boolean) =>
    openState ? openState.setOpen(item.id, next) : setLocalOpen(next);
  const hasChildren =
    typeof item.children === 'function' ? !!item.expandable : !!item.children?.length;
  const children = hasChildren && open ? resolveChildren(item.children) : undefined;

  const content = (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      {item.icon && (
        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
          {item.icon}
        </span>
      )}
      <span className="min-w-0 truncate" style={item.labelStyle}>
        {item.label}
      </span>
      {item.trailing && (
        <span className="ml-auto shrink-0 pl-2 text-muted-foreground">{item.trailing}</span>
      )}
    </span>
  );
  const chevron = (
    <ChevronRight
      aria-hidden="true"
      className={cn(
        'size-4 shrink-0 transition-transform motion-reduce:transition-none',
        open && 'rotate-90',
        !hasChildren && 'invisible'
      )}
    />
  );
  const row = hasChildren ? (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={cn(ROW_CLASSES, TOGGLE_CLASSES)}
    >
      {chevron}
      {content}
    </button>
  ) : (
    <div
      // A described leaf takes focus so keyboard users get its tooltip too; others stay inert.
      tabIndex={item.description ? 0 : undefined}
      className={cn(ROW_CLASSES, item.description && FOCUS_CLASSES)}
    >
      {chevron}
      {content}
    </div>
  );

  return (
    <li data-slot="wind-chat-disclosure-tree-item" className="min-w-0">
      {item.description ? (
        <Tooltip>
          <TooltipTrigger asChild>{row}</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent align="start">{item.description}</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      ) : (
        row
      )}
      {children && <DisclosureTree items={children} openState={openState} className="ml-7" />}
    </li>
  );
}

function resolveChildren(children: DisclosureTreeItem['children']) {
  return typeof children === 'function' ? children() : (children ?? []);
}
