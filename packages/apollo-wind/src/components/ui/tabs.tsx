import * as TabsPrimitive from '@radix-ui/react-tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

interface ScrollableTabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  containerClassName?: string;
  scrollButtonClassName?: string;
  previousButtonLabel?: string;
  nextButtonLabel?: string;
}

const ScrollableTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  ScrollableTabsListProps
>(
  (
    {
      className,
      containerClassName,
      scrollButtonClassName,
      previousButtonLabel = 'Scroll tabs left',
      nextButtonLabel = 'Scroll tabs right',
      ...props
    },
    forwardedRef
  ) => {
    const listRef = React.useRef<HTMLDivElement>(null);
    const [hasOverflow, setHasOverflow] = React.useState(false);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);
    const animationFrameRef = React.useRef<number | null>(null);
    const revealOnNextFrameRef = React.useRef(false);

    React.useImperativeHandle(forwardedRef, () => listRef.current as HTMLDivElement);

    const updateScrollState = React.useCallback(() => {
      const list = listRef.current;
      if (!list) return;

      const maxScrollLeft = list.scrollWidth - list.clientWidth;
      setHasOverflow(maxScrollLeft > 1);
      setCanScrollLeft(list.scrollLeft > 1);
      setCanScrollRight(list.scrollLeft < maxScrollLeft - 1);
    }, []);

    const revealActiveTab = React.useCallback(() => {
      const list = listRef.current;
      const activeTab = list?.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (!list || !activeTab) return;

      const listRect = list.getBoundingClientRect();
      const activeTabRect = activeTab.getBoundingClientRect();

      if (activeTabRect.left < listRect.left) {
        list.scrollBy({ left: activeTabRect.left - listRect.left, behavior: 'smooth' });
      } else if (activeTabRect.right > listRect.right) {
        list.scrollBy({ left: activeTabRect.right - listRect.right, behavior: 'smooth' });
      }
    }, []);

    const scheduleLayoutUpdate = React.useCallback(
      (revealActive = false) => {
        revealOnNextFrameRef.current ||= revealActive;
        if (animationFrameRef.current !== null) return;

        animationFrameRef.current = requestAnimationFrame(() => {
          animationFrameRef.current = null;
          updateScrollState();

          if (revealOnNextFrameRef.current) {
            revealOnNextFrameRef.current = false;
            revealActiveTab();
          }
        });
      },
      [revealActiveTab, updateScrollState]
    );

    React.useEffect(() => {
      const list = listRef.current;
      if (!list) return;

      list.scrollLeft = 0;
      scheduleLayoutUpdate(true);

      const handleScroll = () => scheduleLayoutUpdate();
      list.addEventListener('scroll', handleScroll);

      const resizeObserver = new ResizeObserver(() => scheduleLayoutUpdate(true));
      resizeObserver.observe(list);

      const mutationObserver = new MutationObserver((mutations) => {
        if (
          mutations.some(
            (mutation) => mutation.type === 'childList' || mutation.attributeName === 'data-state'
          )
        ) {
          scheduleLayoutUpdate(true);
        }
      });
      mutationObserver.observe(list, {
        attributes: true,
        attributeFilter: ['data-state'],
        childList: true,
        subtree: true,
      });

      return () => {
        list.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }, [scheduleLayoutUpdate]);

    const scroll = (direction: 'left' | 'right') => {
      const list = listRef.current;
      if (!list) return;

      list.scrollBy({
        left: direction === 'left' ? -list.clientWidth : list.clientWidth,
        behavior: 'smooth',
      });
    };

    const scrollButtonClass = cn(
      'grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30',
      scrollButtonClassName
    );

    return (
      <div className={cn('flex w-full min-w-0 items-center gap-1', containerClassName)}>
        {hasOverflow && (
          <button
            type="button"
            aria-label={previousButtonLabel}
            title={previousButtonLabel}
            disabled={!canScrollLeft}
            onClick={() => scroll('left')}
            className={scrollButtonClass}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
        )}
        <TabsList
          ref={listRef}
          className={cn(
            'min-w-0 flex-1 justify-start overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            className
          )}
          {...props}
        />
        {hasOverflow && (
          <button
            type="button"
            aria-label={nextButtonLabel}
            title={nextButtonLabel}
            disabled={!canScrollRight}
            onClick={() => scroll('right')}
            className={scrollButtonClass}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        )}
      </div>
    );
  }
);
ScrollableTabsList.displayName = 'ScrollableTabsList';

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { ScrollableTabsList, Tabs, TabsContent, TabsList, TabsTrigger };
export type { ScrollableTabsListProps };
