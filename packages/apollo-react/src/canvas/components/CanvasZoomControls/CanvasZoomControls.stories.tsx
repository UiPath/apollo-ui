import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { useState } from 'react';
import { StoryInfoPanel, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasZoomControls } from './CanvasZoomControls';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof CanvasZoomControls> = {
  title: 'Components/Controls/CanvasZoomControls',
  component: CanvasZoomControls,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof CanvasZoomControls>;

// ============================================================================
// Story Components
// ============================================================================

function VerticalStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasZoomControls />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — vertical"
        description="Default vertical orientation. Zoom in, zoom out, and fit to screen buttons are stacked vertically."
      />
    </BaseCanvas>
  );
}

function HorizontalStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-center">
        <CanvasZoomControls orientation="horizontal" />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — horizontal"
        description="Horizontal orientation. Buttons are laid out in a row."
      />
    </BaseCanvas>
  );
}

function WithOrganizeStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });
  const [organizeCount, setOrganizeCount] = useState(0);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasZoomControls
          orientation="vertical"
          onOrganize={() => setOrganizeCount((c) => c + 1)}
        />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — with organize"
        description={`Includes the optional "Tidy up" button. Organize pressed: ${organizeCount} time${organizeCount === 1 ? '' : 's'}.`}
      />
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Vertical: Story = {
  name: 'Vertical',
  render: () => <VerticalStory />,
};

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => <HorizontalStory />,
};

export const WithOrganize: Story = {
  name: 'With Organize',
  render: () => <WithOrganizeStory />,
};
