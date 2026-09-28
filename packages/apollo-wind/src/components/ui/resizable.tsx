import { GripVertical } from 'lucide-react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { cn } from '@/lib/index';

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof Group>) => (
  <Group
    data-slot="resizable-panel-group"
    className={cn('flex h-full w-full', className)}
    {...props}
  />
);

const ResizablePanel = Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) => (
  <Separator
    data-slot="resizable-handle"
    className={cn(
      'group relative flex w-px items-center justify-center bg-[var(--resizable-handle-divider-bg,var(--ap-wind-border))] transition-colors data-[separator=hover]:bg-primary! data-[separator=active]:bg-primary! after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:-translate-y-1/2 aria-[orientation=horizontal]:after:translate-x-0 [&[aria-orientation=horizontal]>div]:rotate-90',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border transition-colors group-data-[separator=hover]:bg-primary! group-data-[separator=active]:bg-primary! [.light:not(.react-flow)_&]:bg-border-subtle [.dark:not(.react-flow)_&]:bg-foreground-subtle [.light:not(.react-flow)_&]:border-border-subtle [.light-hc_&]:border-border-subtle [.dark:not(.react-flow)_&]:border-border-subtle [.dark-hc_&]:border-border-subtle">
        <GripVertical className="h-2.5 w-2.5 [.light:not(.react-flow)_&]:text-foreground-emp [.light-hc_&]:text-foreground-inverse [.dark:not(.react-flow)_&]:text-foreground-inverse [.dark-hc_&]:text-foreground-inverse" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
export type { PanelImperativeHandle };
