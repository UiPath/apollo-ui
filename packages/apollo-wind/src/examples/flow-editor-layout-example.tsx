import { Copy, MoreVertical, Play, Plus } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type PanelImperativeHandle,
} from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Row, Column } from '@/components/ui/layout';
import { cn } from '@/lib';
import { useCallback, useRef, useEffect } from 'react';
import { Label } from '@radix-ui/react-label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LatchedButtonProps {
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function LatchedButton({ isActive, icon, label, onClick }: LatchedButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'w-[40px] h-[40px] rounded-r-2xl rounded-l-none bg-background border',
            isActive
              ? '-ml-px w-[41px] border-y-border border-r-border border-l-background'
              : 'border-l-0 border-border hover:bg-muted'
          )}
          onClick={onClick}
        >
          <div
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-lg transition-colors',
              isActive ? 'bg-primary text-background' : 'bg-transparent text-foreground'
            )}
          >
            {icon}
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export interface SidebarPanelConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export interface FlowEditorLayoutProps {
  className?: string;

  // Sidebar
  sidebarOptions?: SidebarPanelConfig[];
  sidebarContent?: React.ReactNode;
  activeSidebarId?: string;
  sidebarOpen?: boolean;
  onSidebarChange?: (panelId: string) => void;
  onSidebarOpenChange?: (open: boolean) => void;

  // Main content
  mainContent?: React.ReactNode;

  // Bottom panel
  bottomContent?: React.ReactNode;
  bottomOpen?: boolean;
}

export function FlowEditorLayout({
  className,
  sidebarOptions,
  sidebarContent,
  activeSidebarId,
  sidebarOpen = false,
  onSidebarChange,
  onSidebarOpenChange,
  mainContent,
  bottomContent,
  bottomOpen = false,
}: FlowEditorLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<PanelImperativeHandle>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updateSwitcherPosition = useCallback(() => {
    if (!containerRef.current || !switcherRef.current) return;

    if (!bottomOpen) {
      switcherRef.current.style.bottom = '24px';
      return;
    }

    const panelSize = bottomPanelRef.current?.getSize();
    if (panelSize !== undefined) {
      const containerHeight = containerRef.current.offsetHeight;
      const bottomHeight = (panelSize.asPercentage / 100) * containerHeight;
      switcherRef.current.style.bottom = `${bottomHeight + 24}px`;
    }
  }, [bottomOpen]);

  useEffect(() => {
    updateSwitcherPosition();

    const handleResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateSwitcherPosition);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateSwitcherPosition]);

  const handlePanelResize = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateSwitcherPosition);
  }, [updateSwitcherPosition]);

  const handlePanelSelect = useCallback(
    (panelId: string) => {
      if (activeSidebarId === panelId) {
        onSidebarOpenChange?.(!sidebarOpen);
      } else {
        onSidebarChange?.(panelId);
        if (!sidebarOpen) {
          onSidebarOpenChange?.(true);
        }
      }
    },
    [activeSidebarId, sidebarOpen, onSidebarChange, onSidebarOpenChange]
  );

  return (
    <TooltipProvider>
      <Row className={cn('h-screen bg-background', className)}>
        {/* Left Sidebar */}
        <div
          className={cn(
            'bg-background overflow-hidden transition-all duration-300 ease-in-out',
            sidebarOpen ? 'w-72' : 'w-0'
          )}
        >
          {sidebarOpen && <Column className="w-72 h-full">{sidebarContent}</Column>}
        </div>

        {/* Main Content */}
        <Column ref={containerRef} className="flex-1 relative bg-muted m-1 rounded-3xl border">
          {/* Panel Switcher - latched to bottom left edge */}
          {sidebarOptions && sidebarOptions.length > 0 && (
            <Column
              ref={switcherRef}
              gap={2}
              className="absolute left-0 z-10"
              style={{ bottom: 24 }}
            >
              {sidebarOptions.map((panel) => (
                <LatchedButton
                  key={panel.id}
                  isActive={activeSidebarId === panel.id && sidebarOpen}
                  icon={panel.icon}
                  label={panel.label}
                  onClick={() => handlePanelSelect(panel.id)}
                />
              ))}
            </Column>
          )}

          <Column className="flex-1 relative rounded-3xl overflow-hidden">
            <ResizablePanelGroup orientation="vertical" className="h-full">
              {/* Center */}
              <ResizablePanel defaultSize="100%" minSize="30%">
                <Column className="flex-1 h-full">{mainContent}</Column>
              </ResizablePanel>

              {/* Bottom Panel */}
              {bottomOpen && bottomContent && (
                <>
                  <ResizableHandle />
                  <ResizablePanel
                    panelRef={bottomPanelRef}
                    defaultSize="30%"
                    minSize="15%"
                    maxSize="50%"
                    onResize={handlePanelResize}
                  >
                    <Column className="flex-1 h-full bg-background">{bottomContent}</Column>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </Column>
        </Column>
      </Row>
    </TooltipProvider>
  );
}

// ============================================================================
// Exports -- TEMPORARY
// ============================================================================

function CanvasToolbar() {
  return (
    <Row className="absolute bottom-4 left-1/2 -translate-x-1/2" align="center" gap={1}>
      <div className="flex items-center gap-1 rounded-lg border bg-background p-1.5">
        <ToggleGroup type="single" defaultValue="build" className="gap-0">
          <ToggleGroupItem
            value="build"
            className="h-8 rounded-md px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Build
          </ToggleGroupItem>
          <ToggleGroupItem
            value="evaluate"
            className="h-8 rounded-md px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Evaluate
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Play className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </Row>
  );
}

function PublishToolbar() {
  return (
    <Row className="absolute bottom-4 right-4">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-1.5 pl-3">
        <Label htmlFor="toolbar-active" className="text-sm font-medium">
          Active
        </Label>
        <Switch id="toolbar-active" />

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Row>
  );
}

export { CanvasToolbar, PublishToolbar };
