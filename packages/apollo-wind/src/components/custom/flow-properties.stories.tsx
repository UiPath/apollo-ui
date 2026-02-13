import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FlowProperties } from './flow-properties';

const meta = {
  title: 'Components/UiPath/Flow Properties',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive: click Properties on the bar to expand, close button to collapse. */
export const Default: Story = {
  render: function DefaultStory() {
    const [expanded, setExpanded] = useState(false);
    return (
      <div className="future-dark flex h-[700px] bg-future-surface p-4">
        <div className="relative flex flex-1 flex-col">
          {/* Collapsed bar: top-right when not expanded */}
          {!expanded && (
            <div className="absolute right-0 top-0 z-10 w-[680px] max-w-full">
              <FlowProperties
                expanded={false}
                flowName="Invoice processing"
                flowType="Workflow"
                onExpand={() => setExpanded(true)}
              />
            </div>
          )}
          <div className="flex flex-1 items-center justify-center text-sm text-future-foreground-muted">
            Canvas area
          </div>
        </div>
        {expanded && (
          <div className="shrink-0 p-4 pl-0">
            <FlowProperties
              className="h-full"
              expanded
              nodeName="Validate invoice"
              nodeType="AI Agent"
              onClose={() => setExpanded(false)}
            />
          </div>
        )}
      </div>
    );
  },
};

/** Collapsed state only — bar on the canvas (no expand handler). */
export const Collapsed: Story = {
  render: () => (
    <div className="future-dark bg-future-surface p-4">
      <FlowProperties
        expanded={false}
        flowName="Invoice processing"
        flowType="Workflow"
      />
    </div>
  ),
};

/** Expanded state only — full panel (no close handler). */
export const Expanded: Story = {
  render: () => (
    <div className="future-dark flex h-[700px] bg-future-surface p-4">
      <div className="flex flex-1 items-center justify-center text-sm text-future-foreground-muted">
        Canvas area
      </div>
      <FlowProperties
        expanded
        nodeName="AI Agent"
        nodeType="AI Agent"
        activeTab="properties"
      />
    </div>
  ),
};
