import type { Meta, StoryObj } from '@storybook/react';
import { Play, Plus, RotateCcw, SkipForward, Square, StepForward, StickyNote } from 'lucide-react';
import { useState } from 'react';
import {
  CanvasToolbar,
  CanvasToolbarButton,
  CanvasToolbarSeparator,
  CanvasToolbarToggleGroup,
  CanvasToolbarToggleItem,
} from './index';

const meta = {
  title: 'Canvas/Toolbar/CanvasToolbar',
  component: CanvasToolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
      description: 'Position of the toolbar on the canvas',
    },
    hidden: {
      control: 'boolean',
      description: 'When true, hides the entire toolbar',
    },
    disabled: {
      control: 'boolean',
      description: 'When true, disables all interactive children (buttons, toggles)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the container',
    },
  },
} satisfies Meta<typeof CanvasToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default toolbar with toggle groups, buttons, and separators.
 * Demonstrates a complete toolbar similar to the flow-workbench CanvasModeToolbar.
 * Toggle debug mode to see the disabled state in action.
 */
export const Default: Story = {
  args: {
    position: 'bottom-center',
    hidden: false,
    disabled: false,
    children: null,
  },
  render: (args) => {
    const [mode, setMode] = useState<'design' | 'evaluate'>('design');
    const [isDebugRunning, setIsDebugRunning] = useState(false);

    return (
      <CanvasToolbar {...args} disabled={args.disabled || isDebugRunning}>
        <CanvasToolbarToggleGroup
          value={mode}
          onValueChange={(value) => setMode(value as 'design' | 'evaluate')}
        >
          <CanvasToolbarToggleItem value="design">Build</CanvasToolbarToggleItem>
          <CanvasToolbarToggleItem value="evaluate">Evaluate</CanvasToolbarToggleItem>
        </CanvasToolbarToggleGroup>

        <CanvasToolbarSeparator />

        {!isDebugRunning ? (
          <CanvasToolbarButton
            icon={<Play className="h-4 w-4" />}
            label="Run debug"
            onClick={() => setIsDebugRunning(true)}
          />
        ) : (
          <>
            <CanvasToolbarButton
              icon={<Square className="h-4 w-4 text-destructive" />}
              label="Stop debug"
              onClick={() => setIsDebugRunning(false)}
            />
            <CanvasToolbarButton
              icon={<StepForward className="h-4 w-4" />}
              label="Step over"
              onClick={() => console.log('Step')}
            />
            <CanvasToolbarButton
              icon={<SkipForward className="h-4 w-4" />}
              label="Continue"
              onClick={() => console.log('Continue')}
            />
            <CanvasToolbarButton
              icon={<RotateCcw className="h-4 w-4" />}
              label="Restart"
              onClick={() => console.log('Restart')}
            />
          </>
        )}

        <CanvasToolbarSeparator />

        <CanvasToolbarButton
          icon={<Plus className="h-4 w-4" />}
          label="Add node"
          onClick={() => console.log('Add')}
        />
        <CanvasToolbarButton
          icon={<StickyNote className="h-4 w-4" />}
          label="Add note"
          onClick={() => console.log('Add note')}
        />
      </CanvasToolbar>
    );
  },
};
