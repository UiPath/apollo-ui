import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Separator, TooltipProvider } from '@uipath/apollo-wind';
import {
  Bug,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  Square,
} from 'lucide-react';
import { useState } from 'react';
import { useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { Panel } from '../../xyflow/react';
import { BaseCanvas } from '../BaseCanvas';
import {
  CanvasModeToolbar,
  TOOLBAR_ICON_BUTTON_CLASS,
} from '../CanvasModeToolbar/CanvasModeToolbar';
import { CanvasZoomControls } from '../CanvasZoomControls';
import { ToolbarButton } from '../ToolbarButton';
import { CanvasBottomPanel } from './CanvasBottomPanel';
import type { CanvasBottomPanelTab } from './CanvasBottomPanel.types';

const meta: Meta<typeof CanvasBottomPanel> = {
  title: 'Components/Controls/CanvasBottomPanel',
  component: CanvasBottomPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CanvasBottomPanel>;

function DebugContent() {
  return (
    <div className="grid h-full grid-cols-[220px_1fr]">
      <div className="border-r border-border-subtle p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">Run history</p>
        <button type="button" className="w-full rounded-lg bg-surface-overlay p-3 text-left">
          <span className="block text-xs font-medium text-foreground">Flow run</span>
          <span className="mt-1 block text-[11px] text-foreground-muted">Completed in 2.4s</span>
        </button>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-success" />
          Execution completed
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs text-foreground-muted">
          Select an execution step to inspect its input, output, logs, and metrics.
        </div>
      </div>
    </div>
  );
}

function EvaluateContent() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <Sparkles className="mx-auto mb-3 size-6 text-foreground-accent" />
        <p className="text-sm font-medium text-foreground">Evaluate your flow</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Connect a dataset and evaluators in your product, then render that experience here.
        </p>
        <Button className="mt-4" size="sm">
          Start evaluation
        </Button>
      </div>
    </div>
  );
}

function usePanelState(initialCollapsed = false) {
  const [activeTabId, setActiveTabId] = useState('debug');
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const tabs: CanvasBottomPanelTab[] = [
    {
      id: 'debug',
      label: (
        <>
          <Bug className="size-3" />
          Debug
        </>
      ),
      ariaLabel: 'Debug',
      content: <DebugContent />,
    },
    {
      id: 'evaluate',
      label: (
        <>
          <FlaskConical className="size-3" />
          Evaluate
        </>
      ),
      ariaLabel: 'Evaluate',
      content: <EvaluateContent />,
    },
  ];

  return {
    activeTabId,
    setActiveTabId,
    isCollapsed,
    setIsCollapsed,
    tabs,
  };
}

function PanelExample({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const state = usePanelState(initialCollapsed);

  return (
    <div className="h-[380px] bg-surface p-4">
      <CanvasBottomPanel
        className="h-full"
        tabs={state.tabs}
        activeTabId={state.activeTabId}
        onTabChange={state.setActiveTabId}
        isCollapsed={state.isCollapsed}
        onCollapsedChange={state.setIsCollapsed}
        headerActions={
          <>
            <Button size="xs" variant="ghost">
              Clear
            </Button>
            <ToolbarButton
              label={state.isCollapsed ? 'Expand panel' : 'Collapse panel'}
              onClick={() => state.setIsCollapsed(!state.isCollapsed)}
            >
              {state.isCollapsed ? <ChevronUp /> : <ChevronDown />}
            </ToolbarButton>
          </>
        }
      />
    </div>
  );
}

export const Collapsed: Story = {
  render: () => <PanelExample initialCollapsed />,
};

export const Expanded: Story = {
  render: () => <PanelExample />,
};

function CanvasCompositionStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });
  const state = usePanelState();

  return (
    <div className="h-screen">
      <BaseCanvas {...canvasProps} mode="design">
        <Panel position="top-center">
          <CanvasModeToolbar>
            <ToolbarButton label="Run debug" className={TOOLBAR_ICON_BUTTON_CLASS}>
              <Play />
            </ToolbarButton>
            <ToolbarButton label="Stop" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
              <Square />
            </ToolbarButton>
            <Separator orientation="vertical" className="h-5" />
            <ToolbarButton label="Restart" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
              <RotateCcw />
            </ToolbarButton>
          </CanvasModeToolbar>
        </Panel>
        <Panel position="bottom-right" className="mb-16">
          <CanvasZoomControls />
        </Panel>
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10">
          <CanvasBottomPanel
            className="pointer-events-auto h-72"
            tabs={state.tabs}
            activeTabId={state.activeTabId}
            onTabChange={state.setActiveTabId}
            isCollapsed={state.isCollapsed}
            onCollapsedChange={state.setIsCollapsed}
            headerActions={
              <ToolbarButton
                label={state.isCollapsed ? 'Expand panel' : 'Collapse panel'}
                onClick={() => state.setIsCollapsed(!state.isCollapsed)}
              >
                {state.isCollapsed ? <ChevronUp /> : <ChevronDown />}
              </ToolbarButton>
            }
          />
        </div>
      </BaseCanvas>
    </div>
  );
}

export const CanvasComposition: Story = {
  name: 'Debug / Evaluate Canvas Composition',
  decorators: [withCanvasProviders()],
  render: () => <CanvasCompositionStory />,
};
