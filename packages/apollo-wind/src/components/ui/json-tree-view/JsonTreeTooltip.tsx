import { createContext, type ReactElement, type ReactNode, useContext, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { useJsonTreeViewTooltipClassName } from './strings';

const HasTooltipProviderContext = createContext(false);

/**
 * One shared Radix provider for every tooltip below it, so each
 * `JsonTreeTooltip` skips mounting its own fallback provider.
 */
export function JsonTreeTooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <HasTooltipProviderContext.Provider value={true}>
        {children}
      </HasTooltipProviderContext.Provider>
    </TooltipProvider>
  );
}

interface JsonTreeTooltipProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Waits the longer 700ms before opening, for dense controls. */
  delay?: boolean;
  /** Keeps the tooltip closed (e.g. while the trigger's own menu is open). */
  hide?: boolean;
  /** A single element; it becomes the trigger without an extra wrapper. */
  children: ReactElement;
}

/** Hover tooltip for the tree's controls, built on apollo-wind's Tooltip. */
export function JsonTreeTooltip({
  content,
  placement = 'top',
  delay = false,
  hide = false,
  children,
}: JsonTreeTooltipProps) {
  const [open, setOpen] = useState(false);
  const contentClassName = useJsonTreeViewTooltipClassName();
  const hasProvider = useContext(HasTooltipProviderContext);
  const isEmpty =
    content == null || content === false || (typeof content === 'string' && !content.trim());

  const tooltip = (
    <Tooltip
      open={open && !hide && !isEmpty}
      onOpenChange={setOpen}
      delayDuration={delay ? 700 : 200}
    >
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side={placement}
          className={cn('max-w-xs wrap-break-word', contentClassName)}
        >
          {content}
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );

  if (hasProvider) return tooltip;
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={100}>
      {tooltip}
    </TooltipProvider>
  );
}
