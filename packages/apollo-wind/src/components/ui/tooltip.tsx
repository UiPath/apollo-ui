import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/lib';

const TooltipProvider = (
  props: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>
) => <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;
TooltipProvider.displayName = 'TooltipProvider';

const Tooltip = (props: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) => (
  <TooltipPrimitive.Root data-slot="tooltip" {...props} />
);
Tooltip.displayName = 'Tooltip';

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>((props, ref) => <TooltipPrimitive.Trigger ref={ref} data-slot="tooltip-trigger" {...props} />);
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipPortal = (props: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Portal>) => (
  <TooltipPrimitive.Portal data-slot="tooltip-portal" {...props} />
);
TooltipPortal.displayName = 'TooltipPortal';

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    data-slot="tooltip-content"
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-border-inverse bg-surface-inverse px-3 py-1.5 text-sm text-foreground-inverse shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipPortal, TooltipContent, TooltipProvider };
