import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NodeRegistryProvider } from '../../../core/NodeRegistryProvider';
import type { AgentFlowResourceNodeData } from '../../../types';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import { agentFlowManifest } from '../agent-flow.manifest';
import { ResourceNode } from './ResourceNode';

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useStore: () => ({ edges: [], isConnecting: false }),
  useConnection: () => ({ inProgress: false }),
  useUpdateNodeInternals: () => vi.fn(),
  useReactFlow: () => ({
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    updateNode: vi.fn(),
    getNode: vi.fn(),
  }),
}));

vi.mock('../../ButtonHandle/useButtonHandles', () => ({
  useButtonHandles: () => null,
}));

vi.mock('../store/agent-flow-store', () => ({
  useAgentFlowStore: () => ({ nodes: [], deleteNode: vi.fn(), actOnSuggestion: vi.fn() }),
  useEdges: () => [],
}));

type ResourceNodeProps = ComponentProps<typeof ResourceNode>;

const baseData: AgentFlowResourceNodeData = {
  type: 'context',
  name: 'Docs',
  description: 'Context resource',
};

const renderResource = (data: Partial<AgentFlowResourceNodeData>) => {
  const props = {
    id: 'resource-1',
    type: 'resource',
    data: { ...baseData, ...data },
    selected: false,
    dragging: false,
    draggable: true,
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    selectable: true,
    deletable: true,
  } as ResourceNodeProps;
  return render(
    <BaseCanvasModeProvider mode="design">
      <NodeRegistryProvider manifest={agentFlowManifest}>
        <ResourceNode {...props} />
      </NodeRegistryProvider>
    </BaseCanvasModeProvider>
  );
};

describe('ResourceNode - Suggestion styling', () => {
  it('ignores data.suggestionType when the node is not a suggestion', () => {
    const { container } = renderResource({ isSuggestion: false, suggestionType: 'delete' });
    expect(container.querySelector('[data-suggestion-type]')).toBeNull();
  });

  it('renders suggestion styling when the node is a suggestion', () => {
    const { container } = renderResource({ isSuggestion: true, suggestionType: 'delete' });
    expect(container.querySelector('[data-suggestion-type="delete"]')).not.toBeNull();
  });
});
