import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind/components/ui/tooltip';
import React, {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTruncationDetection } from '../../material/components/ap-tooltip/useTruncationDetection';

const HasTooltipProviderContext = createContext(false);

/**
 * Marks a subtree as having a TooltipProvider. Wrap this around a Radix
 * `TooltipProvider` so that `CanvasTooltip` can skip adding its own fallback.
 */
export function CanvasTooltipProviderMarker({ children }: PropsWithChildren) {
  return (
    <HasTooltipProviderContext.Provider value={true}>{children}</HasTooltipProviderContext.Provider>
  );
}

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface CanvasTooltipProps extends PropsWithChildren {
  /** Tooltip content (text or ReactNode). */
  content: ReactNode;
  /** Tooltip placement relative to the trigger. */
  placement?: TooltipPlacement;
  /** When true, only show tooltip if trigger text is overflowing. */
  smartTooltip?: boolean;
  /** When true, show the tooltip with a longer delay (700ms). */
  delay?: boolean;
  /** Controlled open state. */
  isOpen?: boolean;
  /** When true, hide the tooltip entirely. */
  hide?: boolean;
}

/**
 * Thin wrapper around apollo-wind's Radix Tooltip that preserves the
 * simple imperative API used throughout the canvas package.
 *
 * Uses the same clone-element strategy as ApTooltip to avoid inserting
 * extra wrapper elements into the DOM.
 */
export function CanvasTooltip({
  content,
  placement = 'top',
  smartTooltip = false,
  delay = false,
  isOpen,
  hide,
  children,
}: Readonly<CanvasTooltipProps>) {
  const childElement = useMemo(
    () => (React.isValidElement(children) ? children : <span>{children}</span>),
    [children]
  );

  // Store childElement in a ref for callbacks that need access without re-creating
  const childElementRef = useRef(childElement);
  childElementRef.current = childElement;

  const childRef = useRef<HTMLElement | null>(null);
  const truncationDetection = useTruncationDetection(childRef);
  const isTruncated = smartTooltip ? truncationDetection.isTruncated : true;

  // Controlled hover state (Radix doesn't have MUI's "empty title hides" pattern)
  const [hoverOpen, setHoverOpen] = useState(false);

  // Stable ref callback that uses childElementRef to avoid dependency on childElement
  const setChildRef = useCallback((node: HTMLElement | null) => {
    childRef.current = node;

    const childRefProp = childElementRef.current.props.ref;
    if (typeof childRefProp === 'function') {
      childRefProp(node);
    } else if (childRefProp && typeof childRefProp === 'object') {
      (childRefProp as React.RefObject<HTMLElement | null>).current = node;
    }
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      truncationDetection.check();
      const childProps = childElementRef.current.props;
      childProps.onMouseEnter?.(e);
    },
    [truncationDetection.check]
  );

  const triggerWithSmartTooltipHandlers = useMemo(
    () =>
      React.cloneElement(childElement, {
        ref: setChildRef,
        onMouseEnter: handleMouseEnter,
      }),
    [childElement, setChildRef, handleMouseEnter]
  );

  const triggerWithHandlers = smartTooltip ? triggerWithSmartTooltipHandlers : childElement;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && smartTooltip) {
        truncationDetection.check();
      }
      setHoverOpen(nextOpen);
    },
    [smartTooltip, truncationDetection.check]
  );

  const isEmptyContent =
    content == null || content === false || (typeof content === 'string' && content.trim() === '');

  // Priority ordering matches ApTooltip: isOpen > hide > smartTooltip
  const isTooltipHidden = useMemo(() => {
    if (isOpen != null) return !isOpen;
    if (hide != null) return hide;
    if (smartTooltip && !isTruncated) return true;
    return false;
  }, [isOpen, hide, smartTooltip, isTruncated]);

  const effectiveOpen = isEmptyContent || isTooltipHidden ? false : (isOpen ?? hoverOpen);

  const hasProvider = useContext(HasTooltipProviderContext);

  const tooltip = (
    <Tooltip open={effectiveOpen} onOpenChange={handleOpenChange} delayDuration={delay ? 700 : 200}>
      <TooltipTrigger asChild>{triggerWithHandlers}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side={placement} className="z-1200 max-w-xs break-words">
          {content}
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );

  if (hasProvider) {
    return tooltip;
  }

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={100}>
      {tooltip}
    </TooltipProvider>
  );
}

export type { CanvasTooltipProps };
