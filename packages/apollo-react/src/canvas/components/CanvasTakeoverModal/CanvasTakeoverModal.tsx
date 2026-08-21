import { cn } from '@uipath/apollo-wind';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { type MouseEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import FocusLock from 'react-focus-lock';

export interface CanvasTakeoverModalProps {
  /** Whether the takeover is visible. */
  open: boolean;
  /** Called when the takeover requests to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible heading shown in the modal header. */
  title: ReactNode;
  /** Optional content rendered after the title. */
  headerActions?: ReactNode;
  /** Optional fixed-width navigation or supporting pane. */
  sidebar?: ReactNode;
  /** Main takeover content. */
  children: ReactNode;
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Initial expanded state when uncontrolled. */
  defaultExpanded?: boolean;
  /** Called when the expanded state changes. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Additional class names for the takeover surface. */
  className?: string;
  /** Additional class names for the optional sidebar. */
  sidebarClassName?: string;
  /** Close when the dimmed backdrop is pressed. @default true */
  closeOnBackdropClick?: boolean;
}

/**
 * A canvas-scoped modal for workflows that need substantially more room than a panel.
 * The parent must establish a positioned containing block (for example, `position: relative`).
 */
export function CanvasTakeoverModal({
  open,
  onOpenChange,
  title,
  headerActions,
  sidebar,
  children,
  expanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  className,
  sidebarClassName,
  closeOnBackdropClick = true,
}: CanvasTakeoverModalProps) {
  const titleId = useId();
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const expanded = controlledExpanded ?? uncontrolledExpanded;

  useEffect(() => {
    if (!open) return;

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const animationFrame = requestAnimationFrame(() => expandButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange?.(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  const setExpanded = (nextExpanded: boolean) => {
    if (controlledExpanded === undefined) setUncontrolledExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) onOpenChange?.(false);
  };

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center bg-black/60',
        expanded ? 'p-0' : 'p-3'
      )}
      onMouseDown={handleBackdropClick}
      data-testid="canvas-takeover-backdrop"
    >
      <FocusLock autoFocus={false} className="contents">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-expanded={expanded}
          className={cn(
            'flex min-h-0 flex-col overflow-hidden border border-border-subtle bg-surface-raised text-foreground shadow-xl transition-[width,height,border-radius] duration-200',
            expanded ? 'h-full w-full rounded-none' : 'h-[95%] w-[95%] rounded-2xl',
            className
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-4">
            <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold">
              {title}
            </h2>
            {headerActions}
            <div className="-mr-1 flex shrink-0 items-center gap-1">
              <button
                ref={expandButtonRef}
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="grid size-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                aria-label={expanded ? 'Collapse modal' : 'Expand modal'}
                title={expanded ? 'Collapse modal' : 'Expand modal'}
              >
                {expanded ? (
                  <Minimize2 size={16} strokeWidth={1.75} />
                ) : (
                  <Maximize2 size={16} strokeWidth={1.75} />
                )}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange?.(false)}
                className="grid size-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                aria-label="Close modal"
                title="Close modal"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
          </header>
          <div className="flex min-h-0 flex-1">
            {sidebar != null && (
              <aside
                className={cn(
                  'w-64 shrink-0 overflow-auto border-r border-border-subtle',
                  sidebarClassName
                )}
              >
                {sidebar}
              </aside>
            )}
            <main className="min-w-0 flex-1 overflow-auto">{children}</main>
          </div>
        </section>
      </FocusLock>
    </div>
  );
}
