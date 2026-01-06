import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo, useState } from 'react';
import {
  createNode,
  NodePositions,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodePropertiesPanel } from './NodePropertiesPanel';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof NodePropertiesPanel> = {
  title: 'Canvas/NodePropertiesPanel',
  component: NodePropertiesPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof NodePropertiesPanel>;

// ============================================================================
// Initial Data
// ============================================================================

function createInitialNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'decision',
      type: 'uipath.control-flow.decision',
      position: NodePositions.row1col1,
      display: { label: 'Decision Point', subLabel: 'Select this node to configure' },
    }),
    createNode({
      id: 'agent',
      type: 'uipath.agent',
      position: NodePositions.row2col1,
      display: { label: 'Review Agent', subLabel: 'Reviews loan applications' },
    }),
    createNode({
      id: 'approval',
      type: 'uipath.human-task.approval',
      position: NodePositions.row1col2,
      display: { label: 'Manager Approval', subLabel: 'Requires manager sign-off' },
    }),
  ];
}

// ============================================================================
// Story Component
// ============================================================================

function PropertiesPanelStory() {
  const [isPinned, setIsPinned] = useState(false);
  const initialNodes = useMemo(() => createInitialNodes(), []);

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodePropertiesPanel
        position="right"
        enableValidation={true}
        maintainSelection={true}
        defaultPinned={isPinned}
        onPinnedChange={setIsPinned}
        onChange={(nodeId, field, value) => console.log(`Node ${nodeId}: ${field} = ${value}`)}
      />
      <StoryInfoPanel
        title="Node Properties Panel"
        description={`Click on nodes to open properties panel. Panel is ${isPinned ? 'pinned to the right' : 'floating near node'}.`}
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  render: () => <PropertiesPanelStory />,
};
