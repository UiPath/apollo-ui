/**
 * Sequential bar variant, visual-drift contract.
 *
 * Renders the same representative manifests twice: as free-form cards (left) and
 * as sequential bars (right), plus the synthetic start and placeholder rows. The
 * bar reuses BaseNode's resolved display, so icon, label, and colors match the
 * card for every node. This is an early seed of the fuller card/bar contract.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Node, NodeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { useNodeTypeRegistry } from '../../../core';
import {
  createNode,
  useNodeTypesFromRegistry,
  withCanvasProviders,
} from '../../../storybook-utils';
import { BaseCanvas } from '../../BaseCanvas';
import { BaseNode } from '../../BaseNode/BaseNode';
import {
  SEQ_PLACEHOLDER_NODE_TYPE,
  SEQ_START_NODE_TYPE,
  SEQUENTIAL_SYNTHETIC_NODE_TYPES,
  SequentialStepNode,
} from './index';

const meta: Meta = {
  title: 'Components/Nodes/Sequential Bar',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Representative manifests: a trigger, a branch, a container, a data step, and an
// agent. All exist in the default workflow manifest installed by the decorator.
const REPRESENTATIVE_TYPES = [
  'uipath.manual-trigger',
  'uipath.control-flow.decision',
  'uipath.control-flow.foreach',
  'uipath.data.transform',
  'uipath.agent',
] as const;

const CARD_PITCH = 176;
const BAR_PITCH = 128;

function cardNodes(): Node[] {
  return REPRESENTATIVE_TYPES.map((type, i) =>
    createNode({ id: `card-${i}`, type, position: { x: 0, y: i * CARD_PITCH } })
  );
}

function barNodes(): Node[] {
  const start: Node = {
    id: 'seq-start',
    type: SEQ_START_NODE_TYPE,
    position: { x: 0, y: 0 },
    data: { onAddTrigger: () => {} },
    draggable: false,
  };
  const steps = REPRESENTATIVE_TYPES.map((type, i) =>
    createNode({ id: `bar-${i}`, type, position: { x: 0, y: (i + 1) * BAR_PITCH } })
  );
  const placeholder: Node = {
    id: 'seq-placeholder',
    type: SEQ_PLACEHOLDER_NODE_TYPE,
    position: { x: 0, y: (REPRESENTATIVE_TYPES.length + 1) * BAR_PITCH },
    data: { onAdd: () => {} },
    draggable: false,
  };
  return [start, ...steps, placeholder];
}

function BarVariantStory() {
  const registry = useNodeTypeRegistry();
  const cardTypes = useNodeTypesFromRegistry(BaseNode);
  const barTypes = useMemo<NodeTypes>(() => {
    const types: NodeTypes = { default: SequentialStepNode, ...SEQUENTIAL_SYNTHETIC_NODE_TYPES };
    for (const manifest of registry.getAllManifests()) {
      types[manifest.nodeType] = SequentialStepNode;
    }
    return types;
  }, [registry]);

  const cards = useMemo(cardNodes, []);
  const bars = useMemo(barNodes, []);

  return (
    <div className="flex h-full w-full">
      <div className="relative h-full min-w-0 flex-1 border-r border-border">
        <ReactFlowProvider>
          <BaseCanvas
            mode="design"
            nodes={cards}
            nodeTypes={cardTypes}
            fitViewOptions={{ padding: 0.2 }}
            panShortcutTeachingUIMessage=""
          />
        </ReactFlowProvider>
      </div>
      <div className="relative h-full min-w-0 flex-1">
        <ReactFlowProvider>
          <BaseCanvas
            mode="design"
            nodes={bars}
            nodeTypes={barTypes}
            fitViewOptions={{ padding: 0.2 }}
            panShortcutTeachingUIMessage=""
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export const CardVsBar: Story = {
  name: 'Card vs Bar',
  render: () => <BarVariantStory />,
};
