import { type ReactNode, useEffect, useEffectEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** data-slot of the scroll container; the load-more observer uses it as its root */
const FILTER_DROPDOWN_LIST_SLOT = "filter-dropdown-list";

const SKELETON_LABEL_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-1/3"];

// ---------------------------------------------------------------------------
// Skeleton: initial load (no options yet)
// ---------------------------------------------------------------------------

interface FilterDropdownSkeletonProps {
  multiSelect: boolean;
}

function FilterDropdownSkeleton({ multiSelect }: FilterDropdownSkeletonProps) {
  return (
    <div data-slot="filter-dropdown-skeleton" aria-hidden="true">
      {SKELETON_LABEL_WIDTHS.map((width) => (
        <div key={width} className="flex items-center gap-2 px-2 py-1.5">
          {multiSelect && <Skeleton className="size-4 shrink-0 rounded-sm" />}
          <Skeleton className={cn("h-4", width)} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error: replaces the list (no options) or sits below loaded options (inline)
// ---------------------------------------------------------------------------

interface FilterDropdownErrorProps {
  message: ReactNode;
  onRetry?: () => void;
  retryLabel: ReactNode;
  inline?: boolean;
}

function FilterDropdownError({
  message,
  onRetry,
  retryLabel,
  inline = false,
}: FilterDropdownErrorProps) {
  return (
    <div
      data-slot="filter-dropdown-error"
      role="alert"
      className={cn(
        "flex gap-2 text-sm text-muted-foreground",
        inline
          ? "items-center justify-between px-2 py-1"
          : "flex-col items-center px-2 py-3 text-center",
      )}
    >
      <span className={cn(inline && "truncate")}>{message}</span>
      {onRetry && (
        <Button
          type="button"
          variant={inline ? "ghost" : "outline"}
          size="sm"
          className={cn(inline && "h-7 shrink-0 px-2")}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading more: spinner row shown below loaded options
// ---------------------------------------------------------------------------

interface FilterDropdownLoadingMoreProps {
  message?: ReactNode;
}

function FilterDropdownLoadingMore({
  message,
}: FilterDropdownLoadingMoreProps) {
  return (
    <div
      data-slot="filter-dropdown-loading-more"
      className="flex items-center justify-center gap-2 px-2 py-2 text-sm text-muted-foreground"
    >
      <Spinner />
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sentinel: calls onLoadMore when scrolled into view of the list container
// ---------------------------------------------------------------------------

interface FilterDropdownSentinelProps {
  onLoadMore: () => void;
}

function FilterDropdownSentinel({ onLoadMore }: FilterDropdownSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Always calls the latest handler without re-creating the observer
  const handleIntersect = useEffectEvent(() => onLoadMore());

  // The parent unmounts this sentinel while loading or errored, and remounts it
  // afterwards, so each mount re-checks visibility (e.g. a short first page).
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const root = node.closest<HTMLElement>(
      `[data-slot="${FILTER_DROPDOWN_LIST_SLOT}"]`,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) handleIntersect();
      },
      { root, rootMargin: "0px 0px 48px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sentinelRef}
      data-slot="filter-dropdown-sentinel"
      aria-hidden="true"
      className="h-px"
    />
  );
}

export {
  FILTER_DROPDOWN_LIST_SLOT,
  FilterDropdownError,
  FilterDropdownLoadingMore,
  FilterDropdownSentinel,
  FilterDropdownSkeleton,
};
