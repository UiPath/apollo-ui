'use client';

import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { disclosureRowClassName } from '@/lib/disclosure-row';

/**
 * A read-only ARIA tree of rows that disclose their children, for agent traces and nested results
 * in a chat. Unlike `TreeView`, a file manager with search, selection and menus, it has no toolbar
 * and no built-in copy: just rows with a leading icon, a label, trailing info and an optional
 * tooltip, styled like `ToolCall` sections. One row is in the tab order; arrow keys, Home and End
 * move between rows, Right and Left open, close or move in and out, and Enter or Space toggle.
 */

export interface DisclosureTreeItem {
  /** Unique across the whole tree. */
  id: string;
  label: React.ReactNode;
  /** Leading icon, sized to 16px. */
  icon?: React.ReactNode;
  /** Right-aligned secondary info, such as a duration or count. */
  trailing?: React.ReactNode;
  /** Shown in a tooltip on hover or focus of the row, and read as its accessible description. */
  description?: React.ReactNode;
  /** Open on first render. Ignored when `expanded` is controlled. */
  defaultExpanded?: boolean;
  /**
   * The children, or a function that builds them the first time the row opens, so a large trace
   * costs nothing until someone looks. A function needs `expandable`. It runs once per item
   * object, so memoize `items`: new item objects build their children again.
   */
  children?: readonly DisclosureTreeItem[] | (() => readonly DisclosureTreeItem[]);
  /** Whether the row has children; required when `children` is a function. */
  expandable?: boolean;
}

export interface DisclosureTreeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  items: readonly DisclosureTreeItem[];
  /**
   * Ids of the open rows, to hold open state outside the tree (it then survives unmounting).
   * Choose controlled or uncontrolled for the tree's lifetime; switching between them is not
   * supported.
   */
  expanded?: readonly string[];
  /** Called when a row opens or closes, controlled or not. */
  onExpandedChange?: (id: string, expanded: boolean) => void;
}

interface VisibleRow {
  item: DisclosureTreeItem;
  parentId: string | undefined;
  expandable: boolean;
}

interface TreeContextValue {
  isExpanded: (item: DisclosureTreeItem) => boolean;
  toggle: (item: DisclosureTreeItem) => void;
  childrenOf: (item: DisclosureTreeItem) => readonly DisclosureTreeItem[];
  tabbableId: string | undefined;
  setActiveId: (id: string) => void;
  registerRow: (id: string, node: HTMLElement | null) => void;
}

const TreeContext = React.createContext<TreeContextValue | null>(null);

const isExpandable = (item: DisclosureTreeItem) =>
  typeof item.children === 'function' ? !!item.expandable : !!item.children?.length;

const DisclosureTree = React.forwardRef<HTMLDivElement, DisclosureTreeProps>(
  ({ items, expanded, onExpandedChange, className, onKeyDown, ...props }, ref) => {
    const [overrides, setOverrides] = React.useState<ReadonlyMap<string, boolean>>(new Map());
    const [activeId, setActiveId] = React.useState<string>();
    const rows = React.useRef(new Map<string, HTMLElement>());
    // Built children per item object, so a lazy builder runs once per item.
    const built = React.useRef(new WeakMap<DisclosureTreeItem, readonly DisclosureTreeItem[]>());

    const childrenOf = React.useCallback((item: DisclosureTreeItem) => {
      if (typeof item.children !== 'function') return item.children ?? [];
      let children = built.current.get(item);
      if (!children) {
        children = item.children();
        built.current.set(item, children);
      }
      return children;
    }, []);

    const isExpanded = React.useCallback(
      (item: DisclosureTreeItem) =>
        isExpandable(item) &&
        (expanded
          ? expanded.includes(item.id)
          : (overrides.get(item.id) ?? item.defaultExpanded ?? false)),
      [expanded, overrides]
    );

    const setExpanded = React.useCallback(
      (item: DisclosureTreeItem, next: boolean) => {
        if (!isExpandable(item) || isExpanded(item) === next) return;
        if (!expanded) setOverrides((previous) => new Map(previous).set(item.id, next));
        onExpandedChange?.(item.id, next);
      },
      [expanded, isExpanded, onExpandedChange]
    );

    const visible = React.useMemo(() => {
      const list: VisibleRow[] = [];
      const walk = (level: readonly DisclosureTreeItem[], parentId: string | undefined) => {
        for (const item of level) {
          const expandable = isExpandable(item);
          list.push({ item, parentId, expandable });
          if (expandable && isExpanded(item)) walk(childrenOf(item), item.id);
        }
      };
      walk(items, undefined);
      return list;
    }, [items, isExpanded, childrenOf]);

    const tabbableId = visible.some((row) => row.item.id === activeId)
      ? activeId
      : visible[0]?.item.id;

    const focusRow = (id: string | undefined) => {
      if (id === undefined) return;
      setActiveId(id);
      rows.current.get(id)?.focus();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const id = (event.target as HTMLElement).dataset.treeItemId;
      const index = visible.findIndex((row) => row.item.id === id);
      if (index < 0) return;
      const row = visible[index];
      const open = row.expandable && isExpanded(row.item);
      switch (event.key) {
        case 'ArrowDown':
          focusRow(visible[index + 1]?.item.id);
          break;
        case 'ArrowUp':
          focusRow(visible[index - 1]?.item.id);
          break;
        case 'Home':
          focusRow(visible[0]?.item.id);
          break;
        case 'End':
          focusRow(visible[visible.length - 1]?.item.id);
          break;
        case 'ArrowRight':
          if (!row.expandable) return;
          // Into the first child, if the open row has any visible.
          if (open) {
            if (visible[index + 1]?.parentId === row.item.id) focusRow(visible[index + 1].item.id);
          } else setExpanded(row.item, true);
          break;
        case 'ArrowLeft':
          if (open) setExpanded(row.item, false);
          else focusRow(row.parentId);
          break;
        case 'Enter':
        case ' ':
          if (!row.expandable) return;
          setExpanded(row.item, !open);
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    const context = React.useMemo<TreeContextValue>(
      () => ({
        isExpanded,
        toggle: (item) => setExpanded(item, !isExpanded(item)),
        childrenOf,
        tabbableId,
        setActiveId,
        registerRow: (id, node) => {
          if (node) rows.current.set(id, node);
          else rows.current.delete(id);
        },
      }),
      [isExpanded, setExpanded, childrenOf, tabbableId]
    );

    return (
      <TreeContext.Provider value={context}>
        {/* Descriptions are tooltips; a provider here so the tree works without one. */}
        <TooltipProvider delayDuration={300}>
          <div
            ref={ref}
            role="tree"
            data-slot="disclosure-tree"
            className={cn('flex min-w-0 flex-col', className)}
            onKeyDown={handleKeyDown}
            {...props}
          >
            {items.map((item, index) => (
              <DisclosureTreeRow
                key={item.id}
                item={item}
                level={1}
                position={index + 1}
                setSize={items.length}
              />
            ))}
          </div>
        </TooltipProvider>
      </TreeContext.Provider>
    );
  }
);
DisclosureTree.displayName = 'DisclosureTree';

function DisclosureTreeRow({
  item,
  level,
  position,
  setSize,
}: {
  item: DisclosureTreeItem;
  level: number;
  position: number;
  setSize: number;
}) {
  const tree = React.useContext(TreeContext);
  if (!tree) throw new Error('DisclosureTreeRow must be used within DisclosureTree');
  const id = React.useId();
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const expandable = isExpandable(item);
  const open = tree.isExpanded(item);
  const children = open ? tree.childrenOf(item) : [];
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const row = (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the tree handles keys for every row, as the ARIA tree pattern moves focus between rows
    // biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut; the focusable treeitem around it is the control
    <div
      data-slot="disclosure-tree-row"
      onClick={expandable ? () => tree.toggle(item) : undefined}
      className={cn(disclosureRowClassName, expandable && 'cursor-pointer hover:text-foreground')}
    >
      <ChevronRight
        aria-hidden="true"
        className={cn(
          'size-4 shrink-0 transition-transform motion-reduce:transition-none',
          open && 'rotate-90',
          !expandable && 'invisible'
        )}
      />
      {item.icon != null && (
        <span
          data-slot="disclosure-tree-icon"
          className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
        >
          {item.icon}
        </span>
      )}
      <span id={labelId} data-slot="disclosure-tree-label" className="min-w-0 truncate">
        {item.label}
      </span>
      {item.trailing != null && (
        <span
          data-slot="disclosure-tree-trailing"
          className="ml-auto shrink-0 pl-2 text-muted-foreground"
        >
          {item.trailing}
        </span>
      )}
    </div>
  );

  return (
    // The treeitem contains its group, as the ARIA tree pattern requires. Its name is the label
    // alone (not its children's text), and the focus ring is drawn on its own row line.
    <div
      ref={(node) => tree.registerRow(item.id, node)}
      role="treeitem"
      data-slot="disclosure-tree-item"
      data-tree-item-id={item.id}
      aria-level={level}
      aria-posinset={position}
      aria-setsize={setSize}
      aria-expanded={expandable ? open : undefined}
      aria-labelledby={labelId}
      aria-describedby={item.description ? descriptionId : undefined}
      tabIndex={tree.tabbableId === item.id ? 0 : -1}
      onFocus={(event) => {
        if (event.target !== event.currentTarget) return;
        tree.setActiveId(item.id);
        if (item.description) setTooltipOpen(true);
      }}
      onBlur={(event) => {
        if (event.target === event.currentTarget) setTooltipOpen(false);
      }}
      className="min-w-0 outline-hidden [&:focus-visible>[data-slot=disclosure-tree-row]]:ring-2 [&:focus-visible>[data-slot=disclosure-tree-row]]:ring-ring"
    >
      {item.description ? (
        // Hover on the row line or focus on the item opens it; the description is also the
        // item's accessible description, so it is read without the tooltip.
        <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <TooltipTrigger asChild>{row}</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent align="start">{item.description}</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      ) : (
        row
      )}
      {item.description && (
        <span id={descriptionId} hidden>
          {item.description}
        </span>
      )}
      {children.length > 0 && (
        // biome-ignore lint/a11y/useSemanticElements: an ARIA tree nests child rows in role="group"
        <div role="group" className="ml-7 flex min-w-0 flex-col">
          {children.map((child, index) => (
            <DisclosureTreeRow
              key={child.id}
              item={child}
              level={level + 1}
              position={index + 1}
              setSize={children.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { DisclosureTree };
