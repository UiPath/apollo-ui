import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';

export interface NodePropertyPanelLayoutProps {
  input: ReactNode;
  properties: ReactNode;
  output: ReactNode;
  className?: string;
}

/**
 * The canonical three-column canvas panel arrangement used by Flow.
 * Panels share one frame and can be resized without losing their coordinated
 * borders, heights, or minimum usable widths.
 */
export function NodePropertyPanelLayout({
  input,
  properties,
  output,
  className,
}: NodePropertyPanelLayoutProps) {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className={cn(
        'overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-lg',
        className
      )}
    >
      <ResizablePanel defaultSize="33%" minSize="15%">
        <div className="h-full w-full overflow-hidden">{input}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="34%" minSize="15%">
        <div className="h-full w-full overflow-hidden">{properties}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="33%" minSize="15%">
        <div className="h-full w-full overflow-hidden">{output}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
