import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator, TooltipProvider } from '@uipath/apollo-wind';
import {
  Loader2,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Square,
  StepForward,
  StickyNote,
  Undo2,
} from 'lucide-react';
import { ToolbarButton } from '../ToolbarButton';
import { CanvasModeToolbar, CountBadge, TOOLBAR_ICON_BUTTON_CLASS } from './CanvasModeToolbar';

const meta: Meta<typeof CanvasModeToolbar> = {
  title: 'Components/Controls/CanvasModeToolbar',
  component: CanvasModeToolbar,
  parameters: {
    layout: 'centered',
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
type Story = StoryObj<typeof CanvasModeToolbar>;

// ---------------------------------------------------------------------------
// Default — design mode with undo/redo, run debug, add actions
// ---------------------------------------------------------------------------

function DefaultStory() {
  return (
    <div style={{ padding: 32 }}>
      <CanvasModeToolbar>
        <ToolbarButton
          label="Undo (⌘Z)"
          className={`relative ${TOOLBAR_ICON_BUTTON_CLASS}`}
          onClick={() => console.log('undo')}
        >
          <Undo2 />
          <CountBadge count={3} />
        </ToolbarButton>

        <ToolbarButton
          label="Redo (⌘⇧Z)"
          className={`relative ${TOOLBAR_ICON_BUTTON_CLASS}`}
          onClick={() => console.log('redo')}
        >
          <Redo2 />
          <CountBadge count={1} />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5" />

        <ToolbarButton
          label="Run debug"
          className={TOOLBAR_ICON_BUTTON_CLASS}
          onClick={() => console.log('run debug')}
        >
          <Play />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5" />

        <ToolbarButton
          label="Add node"
          className={TOOLBAR_ICON_BUTTON_CLASS}
          onClick={() => console.log('add node')}
        >
          <Plus />
        </ToolbarButton>

        <ToolbarButton
          label="Add note"
          className={TOOLBAR_ICON_BUTTON_CLASS}
          onClick={() => console.log('add note')}
        >
          <StickyNote />
        </ToolbarButton>
      </CanvasModeToolbar>
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultStory />,
};

// ---------------------------------------------------------------------------
// DebugRunning — debug in progress, actions disabled
// ---------------------------------------------------------------------------

function DebugRunningStory() {
  return (
    <div style={{ padding: 32 }}>
      <CanvasModeToolbar>
        <ToolbarButton
          label="Stop debug"
          className={TOOLBAR_ICON_BUTTON_CLASS}
          onClick={() => console.log('stop')}
        >
          <Square strokeWidth={0} className="fill-current text-destructive" />
        </ToolbarButton>

        <ToolbarButton label="Continue" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
          <Play />
        </ToolbarButton>

        <ToolbarButton label="Next step" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
          <StepForward />
        </ToolbarButton>

        <ToolbarButton label="Restart" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
          <Loader2 className="animate-spin" />
        </ToolbarButton>
      </CanvasModeToolbar>
    </div>
  );
}

export const DebugRunning: Story = {
  render: () => <DebugRunningStory />,
};

// ---------------------------------------------------------------------------
// DebugPaused — paused at a breakpoint, step/continue enabled
// ---------------------------------------------------------------------------

function DebugPausedStory() {
  return (
    <div style={{ padding: 32 }}>
      <CanvasModeToolbar>
        <ToolbarButton
          label="Stop debug"
          className={TOOLBAR_ICON_BUTTON_CLASS}
          onClick={() => console.log('stop')}
        >
          <Square strokeWidth={0} className="fill-current text-destructive" />
        </ToolbarButton>

        <ToolbarButton
          label="Continue"
          className={TOOLBAR_ICON_BUTTON_CLASS}
          onClick={() => console.log('continue')}
        >
          <Play />
        </ToolbarButton>

        <ToolbarButton
          label="Next step"
          className={TOOLBAR_ICON_BUTTON_CLASS}
          onClick={() => console.log('step')}
        >
          <StepForward />
        </ToolbarButton>

        <ToolbarButton label="Restart" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
          <RotateCcw />
        </ToolbarButton>
      </CanvasModeToolbar>
    </div>
  );
}

export const DebugPaused: Story = {
  render: () => <DebugPausedStory />,
};

// ---------------------------------------------------------------------------
// ReadOnly — all actions disabled
// ---------------------------------------------------------------------------

function ReadOnlyStory() {
  return (
    <div style={{ padding: 32 }}>
      <CanvasModeToolbar>
        <ToolbarButton
          label="Undo (⌘Z)"
          disabled
          className={`relative ${TOOLBAR_ICON_BUTTON_CLASS}`}
        >
          <Undo2 />
          <CountBadge count={2} />
        </ToolbarButton>

        <ToolbarButton
          label="Redo (⌘⇧Z)"
          disabled
          className={`relative ${TOOLBAR_ICON_BUTTON_CLASS}`}
        >
          <Redo2 />
          <CountBadge count={1} />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5" />

        <ToolbarButton label="Run debug" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
          <Play />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5" />

        <ToolbarButton label="Add node" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
          <Plus />
        </ToolbarButton>

        <ToolbarButton label="Add note" disabled className={TOOLBAR_ICON_BUTTON_CLASS}>
          <StickyNote />
        </ToolbarButton>
      </CanvasModeToolbar>
    </div>
  );
}

export const ReadOnly: Story = {
  render: () => <ReadOnlyStory />,
};
