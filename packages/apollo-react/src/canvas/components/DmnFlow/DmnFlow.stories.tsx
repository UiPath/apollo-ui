import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { NodeRegistryProvider } from '../../core';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { BaseCanvas } from '../BaseCanvas';
import {
  DMN_ICON,
  DMN_REQUIREMENT_SOURCE_HANDLE,
  DMN_REQUIREMENT_TARGET_HANDLE,
  type DmnRequirementKind,
  dmnFlowManifest,
} from './dmn-flow.manifest';

/**
 * A small decision requirements diagram: inputs on the base row, knowledge above them, decisions
 * on top. Each element draws at the width a DRD gives it (decision 288, input data 240, knowledge
 * model and knowledge source 224). Text annotations are left out: consumers draw them with their
 * own node component.
 */
const ORIGIN = { x: 48, y: 48 };
const NODES: Array<{
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  icon?: string;
}> = [
  { id: 'approval', type: 'dmn:decision', label: 'Loan approval', x: 352, y: 0 },
  {
    id: 'grade',
    type: 'dmn:decision',
    label: 'Risk grade',
    x: 32,
    y: 0,
    icon: DMN_ICON.decisionExpression,
  },
  {
    id: 'policy',
    type: 'dmn:knowledgeSource',
    label: 'Lending policy',
    x: 608,
    y: 208,
    width: 224,
  },
  {
    id: 'bands',
    type: 'dmn:businessKnowledgeModel',
    label: 'Risk bands',
    x: 352,
    y: 208,
    width: 224,
  },
  { id: 'income', type: 'dmn:inputData', label: 'Income', x: 32, y: 416, width: 240 },
  { id: 'score', type: 'dmn:inputData', label: 'Credit score', x: 304, y: 416, width: 240 },
  { id: 'amount', type: 'dmn:inputData', label: 'Loan amount', x: 576, y: 416, width: 240 },
];

const requirement = (source: string, target: string, kind: DmnRequirementKind): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle: DMN_REQUIREMENT_SOURCE_HANDLE,
  targetHandle: DMN_REQUIREMENT_TARGET_HANDLE[kind],
});

const EDGES: Edge[] = [
  requirement('grade', 'approval', 'informationRequirement'),
  requirement('income', 'grade', 'informationRequirement'),
  requirement('score', 'approval', 'informationRequirement'),
  requirement('amount', 'approval', 'informationRequirement'),
  requirement('bands', 'approval', 'knowledgeRequirement'),
  requirement('policy', 'approval', 'authorityRequirement'),
];

const DmnFlowStory = () => {
  const initialNodes = useMemo(
    () =>
      NODES.map((node) => ({
        ...createNode({
          id: node.id,
          type: node.type,
          position: { x: ORIGIN.x + node.x, y: ORIGIN.y + node.y },
          data: {
            nodeType: node.type,
            version: '1.0.0',
            display: { label: node.label, ...(node.icon ? { icon: node.icon } : {}) },
          },
        }),
        ...(node.width ? { width: node.width } : {}),
      })),
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: EDGES });

  return <BaseCanvas {...canvasProps} mode="design" />;
};

const meta = {
  title: 'Components/DmnFlow/Decision Requirements',
  component: BaseCanvas,
  decorators: [withCanvasProviders()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BaseCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // Story-level decorator wraps innermost, so `dmnFlowManifest` is the registry under test.
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={dmnFlowManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <DmnFlowStory />,
};
