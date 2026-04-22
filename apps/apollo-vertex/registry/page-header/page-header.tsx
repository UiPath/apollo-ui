"use client";

/* eslint-disable max-lines -- compound component with collapsible actions */
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const pageHeaderVariants = cva("", {
  variants: {
    size: {
      default: [
        "flex flex-wrap items-center gap-4 py-4 px-4 sm:px-6 lg:px-8 min-h-[92px] transition-[padding] duration-300 ease-in-out",
        "@3xl:grid @3xl:grid-cols-[1fr_auto] @3xl:py-0",
        "@3xl:has-[[data-slot=page-header-content]]:grid-cols-[3fr_6fr_3fr]",
      ].join(" "),
      content: "flex flex-col gap-3 pt-[10px] pb-4",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface PageHeaderProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof pageHeaderVariants> {
  bordered?: boolean;
}

function PageHeader({
  className,
  size,
  bordered = false,
  ...props
}: PageHeaderProps) {
  return (
    <div className="@container shrink-0">
      <div
        data-slot="page-header"
        data-size={size}
        className={cn(
          pageHeaderVariants({ size }),
          bordered && "border-b border-border",
          className,
        )}
        {...props}
      />
    </div>
  );
}

type PageHeaderNavProps = React.ComponentProps<"div">;

function PageHeaderNav({ className, ...props }: PageHeaderNavProps) {
  return (
    <div
      data-slot="page-header-nav"
      className={cn(
        "flex items-center gap-3 min-w-0 flex-1 order-1 @3xl:order-none",
        className,
      )}
      {...props}
    />
  );
}

type PageHeaderBackButtonProps = React.ComponentProps<typeof Button>;

function PageHeaderBackButton({
  className,
  children,
  ...props
}: PageHeaderBackButtonProps) {
  return (
    <Button
      data-slot="page-header-back"
      variant="secondary"
      size="icon-lg"
      aria-label="Go back"
      className={cn("shrink-0", className)}
      {...props}
    >
      {children ?? <ArrowLeft className="size-5" />}
    </Button>
  );
}

type PageHeaderTitleGroupProps = React.ComponentProps<"div">;

function PageHeaderTitleGroup({
  className,
  ...props
}: PageHeaderTitleGroupProps) {
  return (
    <div
      data-slot="page-header-title-group"
      className={cn("flex flex-col min-w-0", className)}
      {...props}
    />
  );
}

const pageHeaderTitleVariants = cva(
  "font-bold text-foreground w-full min-w-[80px] truncate transition-[font-size,line-height,letter-spacing] duration-300 ease-in-out",
  {
    variants: {
      size: {
        default:
          "text-base leading-5 @5xl:text-2xl @5xl:leading-8 @5xl:tracking-tight",
        lg: "text-2xl leading-8 tracking-tight",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

interface PageHeaderTitleProps
  extends React.ComponentProps<"h1">,
    VariantProps<typeof pageHeaderTitleVariants> {
  /** Override the rendered element (default: `"h1"`). Props are typed as `h1` attributes. */
  as?: React.ElementType;
}

function PageHeaderTitle({
  className,
  size,
  children,
  as: Comp = "h1",
  ...props
}: PageHeaderTitleProps) {
  return (
    <Comp
      data-slot="page-header-title"
      {...(typeof children === "string" && { title: children })}
      className={cn(pageHeaderTitleVariants({ size }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

type PageHeaderDescriptionProps = React.ComponentProps<"p">;

function PageHeaderDescription({
  className,
  children,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      data-slot="page-header-description"
      {...(typeof children === "string" && { title: children })}
      className={cn("text-xs text-muted-foreground truncate", className)}
      {...props}
    >
      {children}
    </p>
  );
}

type PageHeaderContentProps = React.ComponentProps<"div">;

function PageHeaderContent({ className, ...props }: PageHeaderContentProps) {
  return (
    <div
      data-slot="page-header-content"
      className={cn(
        "flex items-center gap-4 min-w-0",
        // Wrapped row: full width, evenly distributed
        "order-3 basis-full justify-evenly",
        // Grid row: placed in middle column by source order
        "@3xl:order-none @3xl:gap-0 @3xl:justify-evenly",
        className,
      )}
      {...props}
    />
  );
}

type PageHeaderFieldProps = React.ComponentProps<"div">;

function PageHeaderField({ className, ...props }: PageHeaderFieldProps) {
  return (
    <div
      data-slot="page-header-field"
      className={cn("flex flex-col min-w-0", className)}
      {...props}
    />
  );
}

type PageHeaderFieldLabelProps = React.ComponentProps<"p">;

function PageHeaderFieldLabel({
  className,
  ...props
}: PageHeaderFieldLabelProps) {
  return (
    <p
      data-slot="page-header-field-label"
      className={cn("text-xs text-muted-foreground truncate", className)}
      {...props}
    />
  );
}

type PageHeaderFieldValueProps = React.ComponentProps<"p">;

function PageHeaderFieldValue({
  className,
  children,
  ...props
}: PageHeaderFieldValueProps) {
  return (
    <p
      data-slot="page-header-field-value"
      {...(typeof children === "string" && { title: children })}
      className={cn("text-sm font-medium text-foreground truncate", className)}
      {...props}
    >
      {children}
    </p>
  );
}

type PageHeaderActionsProps = React.ComponentProps<"div">;

function PageHeaderActions({ className, ...props }: PageHeaderActionsProps) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn(
        "flex items-center gap-4 shrink-0 ml-auto order-2",
        "@3xl:order-none @3xl:ml-0 @3xl:justify-end",
        className,
      )}
      {...props}
    />
  );
}

interface PageHeaderActionsOverflowProps
  extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
}

function PageHeaderActionsOverflow({
  children,
  className,
  ...triggerProps
}: PageHeaderActionsOverflowProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("shrink-0", className)}
          aria-label="More actions"
          {...triggerProps}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Collapsible Actions ---

interface CollapsibleAction {
  key: string;
  /** The inline button shown when there is room */
  button: React.ReactNode;
  /** The dropdown menu item shown when the button overflows */
  menuItem: React.ReactNode;
}

interface PageHeaderCollapsibleActionsProps {
  /** Actions that collapse into the overflow dropdown when space is tight.
   *  Ordered by priority — first item stays visible the longest. */
  items: CollapsibleAction[];
  /** Content that always lives in the overflow dropdown (e.g. rename, delete). */
  overflowContent?: React.ReactNode;
  /** Minimum width (px) reserved for the nav/title area. @default 200 */
  navMinWidth?: number;
}

function PageHeaderCollapsibleActions({
  items,
  overflowContent,
  navMinWidth = 200,
}: PageHeaderCollapsibleActionsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rulerRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState<number | null>(null);
  const gap = 16;
  const hasMeasured = visibleCount !== null;

  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const itemKeys = items.map((i) => i.key).join(",");

  React.useEffect(() => {
    setVisibleCount(null);
    const container = containerRef.current;
    const ruler = rulerRef.current;
    if (!container || !ruler) return;

    const header = container.closest<HTMLElement>('[data-slot="page-header"]');
    if (!header) return;

    const calculate = () => {
      const currentItems = itemsRef.current;
      const headerWidth = header.clientWidth;
      const headerStyle = getComputedStyle(header);
      const headerPadding =
        Number.parseFloat(headerStyle.paddingLeft) +
        Number.parseFloat(headerStyle.paddingRight);

      const actionsContainer = container.closest<HTMLElement>(
        '[data-slot="page-header-actions"]',
      );
      let fixedWidth = 0;
      if (actionsContainer) {
        for (const child of Array.from(actionsContainer.children)) {
          if (child !== container && child instanceof HTMLElement) {
            fixedWidth += child.offsetWidth + gap;
          }
        }
      }

      const trigger = container.querySelector<HTMLElement>(
        "[data-overflow-trigger]",
      );
      const measuredTriggerWidth = trigger ? trigger.offsetWidth + gap : 0;
      const estimatedTriggerWidth = 36 + gap;

      const rulerItems = Array.from(
        ruler.querySelectorAll<HTMLElement>("[data-ruler-item]"),
      );

      const fitCount = (space: number) => {
        let remaining = space;
        let n = 0;
        for (let i = 0; i < rulerItems.length && i < currentItems.length; i++) {
          const w = rulerItems[i].offsetWidth + (n > 0 ? gap : 0);
          if (remaining < w) break;
          remaining -= w;
          n++;
        }
        return n;
      };

      // In grid mode, the actions column has a fixed width from the grid template,
      // so we measure it directly. In flex mode, calculate from total header width.
      const isGrid = getComputedStyle(header).display === "grid";
      const baseAvailable =
        isGrid && actionsContainer
          ? actionsContainer.clientWidth - fixedWidth
          : headerWidth - headerPadding - navMinWidth - fixedWidth;

      let count = fitCount(baseAvailable);

      if (count < currentItems.length || overflowContent) {
        const triggerWidth = measuredTriggerWidth || estimatedTriggerWidth;
        count = fitCount(baseAvailable - triggerWidth);
      }

      setVisibleCount(count);
    };

    let rafId: number;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculate);
    };

    onResize();
    const observer = new ResizeObserver(onResize);
    observer.observe(header);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [itemKeys, overflowContent, navMinWidth]);

  const safeCount = hasMeasured ? visibleCount : 0;
  const overflowItems = items.slice(safeCount);
  const showTrigger = overflowItems.length > 0 || !!overflowContent;

  return (
    <div
      ref={containerRef}
      className="contents"
      style={hasMeasured ? {} : { visibility: "hidden" }}
    >
      {/* Hidden ruler — measures natural button widths without affecting layout */}
      <div
        ref={rulerRef}
        className="absolute invisible pointer-events-none flex gap-4 -top-[9999px] -left-[9999px]"
        aria-hidden="true"
      >
        {items.map((item) => (
          <div key={item.key} data-ruler-item>
            {item.button}
          </div>
        ))}
      </div>

      {/* Visible collapsible buttons */}
      {items.slice(0, safeCount).map((item) => (
        <React.Fragment key={item.key}>{item.button}</React.Fragment>
      ))}

      {/* Overflow dropdown */}
      {showTrigger && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-overflow-trigger
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Overflow actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflowItems.map((item) => (
              <React.Fragment key={item.key}>{item.menuItem}</React.Fragment>
            ))}
            {overflowItems.length > 0 && overflowContent && (
              <DropdownMenuSeparator />
            )}
            {overflowContent}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export {
  PageHeader,
  pageHeaderVariants,
  PageHeaderNav,
  PageHeaderBackButton,
  PageHeaderTitleGroup,
  PageHeaderTitle,
  pageHeaderTitleVariants,
  PageHeaderDescription,
  PageHeaderContent,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderActions,
  PageHeaderActionsOverflow,
  PageHeaderCollapsibleActions,
};
export type {
  PageHeaderProps,
  PageHeaderNavProps,
  PageHeaderBackButtonProps,
  PageHeaderTitleGroupProps,
  PageHeaderTitleProps,
  PageHeaderDescriptionProps,
  PageHeaderContentProps,
  PageHeaderFieldProps,
  PageHeaderFieldLabelProps,
  PageHeaderFieldValueProps,
  PageHeaderActionsProps,
  PageHeaderActionsOverflowProps,
  CollapsibleAction,
  PageHeaderCollapsibleActionsProps,
};
