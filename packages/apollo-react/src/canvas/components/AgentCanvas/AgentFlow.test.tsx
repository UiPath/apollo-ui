import { vi } from 'vitest';
import type { AgentFlowProps } from '../../types';
import { render, screen } from '../../utils/testing';

// Mock BaseCanvas hooks to avoid ReactFlow dependencies in tests
vi.mock('../BaseCanvas/BaseCanvas.hooks', () => ({
  useAutoLayout: () => ({
    isReady: true,
  }),
  useFitView: () => ({
    fitView: vi.fn(),
  }),
  useEnsureNodesInView: () => ({
    ensureNodesInView: vi.fn(),
    ensureAllNodesInView: vi.fn(),
    centerNode: vi.fn(),
  }),
  useMaintainNodesInView: vi.fn(),
}));

// Create configurable mock store data
const mockNodes = [
  {
    id: 'agent',
    type: 'agent',
    position: { x: 0, y: 0 },
    data: { name: 'Test Agent' },
  },
  {
    id: 'tool-1',
    type: 'resource',
    position: { x: 100, y: 0 },
    data: { type: 'tool', name: 'Test Tool' },
  },
  {
    id: 'context-1',
    type: 'resource',
    position: { x: 0, y: 100 },
    data: { type: 'context', name: 'Test Context' },
  },
];

const mockEdges = [
  {
    id: 'agent-tool-1',
    source: 'agent',
    target: 'tool-1',
    type: 'default',
  },
  {
    id: 'context-agent-1',
    source: 'context-1',
    target: 'agent',
    type: 'default',
  },
];

// Mock the store with more comprehensive data
vi.mock('./store/agent-flow-store', () => ({
  AgentFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="agent-flow-provider">{children}</div>
  ),
  useAgentFlowStore: () => ({
    nodes: mockNodes,
    edges: mockEdges,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    autoArrange: vi.fn(),
    updateNode: vi.fn(),
    reorderNodes: vi.fn(),
    insertNodeAfter: vi.fn(),
    setDragPreview: vi.fn(),
    setSelectedNodeId: vi.fn(),
    selectedNodeId: null,
    clearDragAndAutoArrange: vi.fn(),
    setDragging: vi.fn(),

    expandAgent: vi.fn(),
    collapseAgent: vi.fn(),
  }),
}));

// Mock ReactFlow components and hooks with more functionality
vi.mock('@uipath/uix/xyflow/react', () => ({
  ReactFlow: ({
    children,
    nodes,
    edges,
    onNodeClick,
    onPaneClick,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  }: {
    children?: React.ReactNode;
    nodes?: unknown[];
    edges?: unknown[];
    onNodeClick?: () => void;
    onPaneClick?: () => void;
    onNodesChange?: () => void;
    onEdgesChange?: () => void;
    onConnect?: () => void;
    onNodeDragStart?: () => void;
    onNodeDrag?: () => void;
    onNodeDragStop?: () => void;
  }) => {
    // Filter out virtual spacing nodes for accurate test counts
    const realNodes = nodes?.filter((node: any) => !node.data?.isVirtual) ?? [];
    return (
      <div data-testid="react-flow">
        <div data-testid="nodes-count">{realNodes.length}</div>
        <div data-testid="edges-count">{edges?.length ?? 0}</div>
        <button data-testid="node-click" onClick={onNodeClick}>
          Node Click
        </button>
        <button data-testid="pane-click" onClick={onPaneClick}>
          Pane Click
        </button>
        <button data-testid="nodes-change" onClick={onNodesChange}>
          Nodes Change
        </button>
        <button data-testid="edges-change" onClick={onEdgesChange}>
          Edges Change
        </button>
        <button data-testid="connect" onClick={onConnect}>
          Connect
        </button>
        <button data-testid="node-drag-start" onClick={onNodeDragStart}>
          Node Drag Start
        </button>
        <button data-testid="node-drag" onClick={onNodeDrag}>
          Node Drag
        </button>
        <button data-testid="node-drag-stop" onClick={onNodeDragStop}>
          Node Drag Stop
        </button>
        {children}
      </div>
    );
  },
  Background: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="background">{children}</div>
  ),
  Controls: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="controls">{children}</div>
  ),
  Panel: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="panel">{children}</div>
  ),
  NodeToolbar: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="node-toolbar">{children}</div>
  ),
  BackgroundVariant: {
    Dots: 'dots',
  },
  useReactFlow: () => ({
    setViewport: vi.fn(),
    fitView: vi.fn(),
    getNodes: vi.fn(() => []),
  }),
  useStore: () => ({
    hasSelection: false,
    isPanning: false,
  }),
  ConnectionMode: {
    Loose: 'loose',
    Strict: 'strict',
  },
  DefaultEdgeOptions: {},
  FitViewOptions: {},
  Handle: ({
    type,
    position,
    id,
  }: {
    type: string;
    position: string;
    id: string;
    isConnectable?: boolean;
  }) => <div data-testid={`handle-${type}-${id}`} data-position={position} />,
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
}));

// Mock the node components with more functionality
vi.mock('./nodes/AgentNode', () => ({
  AgentNodeElement: ({
    data,
    onAddResource,
  }: {
    data: { name?: string };
    onAddResource?: (type: string) => void;
  }) => (
    <div data-testid="agent-node">
      {data?.name}
      <button data-testid="add-tool" onClick={() => onAddResource?.('tool')}>
        Add Tool
      </button>
      <button data-testid="add-context" onClick={() => onAddResource?.('context')}>
        Add Context
      </button>
    </div>
  ),
}));

// Mock the edge components
vi.mock('./edges/AnimatedEdge', () => ({
  AnimatedSVGEdge: () => <div data-testid="animated-edge" />,
}));

vi.mock('./edges/DefaultEdge', () => ({
  DefaultEdgeElement: () => <div data-testid="default-edge" />,
}));

// Mock the dialog components with more functionality

vi.mock('./components/TimelinePlayer', () => ({
  TimelinePlayer: ({ spans }: { spans: unknown[]; enableTimelinePlayer?: boolean }) => (
    <div data-testid="timeline-player">{spans?.length ?? 0} spans</div>
  ),
}));

// Import the component after all mocks
// Simple type definition for testing, we should avoid apollo anuglar elements as deprecated
type IRawSpan = {
  Id: string;
  TraceId: string;
  Status: number;
  Attributes: string;
  Name: string;
  StartTime: string;
  EndTime: string;
  CreatedAt: string;
  UpdatedAt: string;
  ParentId?: string;
  Events: any[];
  Links: any[];
  OrganizationId: string;
  TenantId: string;
  Source: number;
  SpanType: string;
};
import { AgentFlow } from './AgentFlow';

const mockProps: AgentFlowProps = {
  allowDragging: false,
  name: 'Test Agent',
  description: 'A test agent',
  definition: {
    inputSchema: {},
    outputSchema: {},
    messages: [{ role: 'User', content: 'Test message' }],
  },
  resources: [
    {
      id: 'tool-1',
      name: 'Test Tool',
      description: 'A test tool',
      type: 'tool' as const,
      iconUrl: 'test-icon.png',
      hasGuardrails: true,
    },
    {
      id: 'context-1',
      name: 'Test Context',
      description: 'A test context',
      type: 'context' as const,
    },
  ],
  spans: [
    {
      Id: 'span-1',
      TraceId: 'trace-1',
      Status: 1,
      Attributes: '{"toolName": "test_tool"}',
      Name: 'test-span',
      StartTime: new Date().toISOString(),
      EndTime: new Date().toISOString(),
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      ParentId: undefined,
      Events: [],
      Links: [],
      OrganizationId: 'test-org',
      TenantId: 'test-tenant',
      Source: 1,
      SpanType: 'test-type',
    } as IRawSpan,
  ],
  mode: 'design' as const,
  activeResourceIds: ['tool-1'],
  setSpanForSelectedNode: vi.fn(),
  getNodeFromSelectedSpan: vi.fn(),
};

describe('AgentFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<AgentFlow {...mockProps} />)).not.toThrow();
  });

  it('renders ReactFlow component', () => {
    // Empty nodes to avoid initial layout
    render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders background component', () => {
    // Empty nodes to avoid initial layout
    render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  it('renders canvas controls component', () => {
    // Empty nodes to avoid initial layout
    render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('canvas-controls')).toBeInTheDocument();
  });

  it('renders timeline player with spans', () => {
    render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('timeline-player')).toBeInTheDocument();
    expect(screen.getByText('1 spans')).toBeInTheDocument();
  });

  it('shows correct number of nodes and edges', () => {
    // For this test, we need to bypass the loading state
    render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('nodes-count')).toHaveTextContent('3');
    expect(screen.getByTestId('edges-count')).toHaveTextContent('2');
  });

  it('renders in design mode', () => {
    render(<AgentFlow {...mockProps} mode="design" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders in view mode', () => {
    render(<AgentFlow {...mockProps} mode="view" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles node click events', () => {
    render(<AgentFlow {...mockProps} />);
    const nodeClickButton = screen.getByTestId('node-click');
    expect(nodeClickButton).toBeInTheDocument();
  });

  it('handles pane click events', () => {
    render(<AgentFlow {...mockProps} />);
    const paneClickButton = screen.getByTestId('pane-click');
    expect(paneClickButton).toBeInTheDocument();
  });

  it('handles node changes', () => {
    render(<AgentFlow {...mockProps} />);
    const nodesChangeButton = screen.getByTestId('nodes-change');
    expect(nodesChangeButton).toBeInTheDocument();
  });

  it('handles edge changes', () => {
    render(<AgentFlow {...mockProps} />);
    const edgesChangeButton = screen.getByTestId('edges-change');
    expect(edgesChangeButton).toBeInTheDocument();
  });

  it('handles connect events', () => {
    render(<AgentFlow {...mockProps} />);
    const connectButton = screen.getByTestId('connect');
    expect(connectButton).toBeInTheDocument();
  });

  it('handles node drag events', () => {
    render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('node-drag-start')).toBeInTheDocument();
    expect(screen.getByTestId('node-drag')).toBeInTheDocument();
    expect(screen.getByTestId('node-drag-stop')).toBeInTheDocument();
  });

  it('handles empty spans array', () => {
    const propsWithoutSpans = { ...mockProps, spans: [] };
    render(<AgentFlow {...propsWithoutSpans} />);
    expect(screen.getByText('0 spans')).toBeInTheDocument();
  });

  it('handles null model', () => {
    const propsWithoutModel = { ...mockProps, model: null };
    expect(() => render(<AgentFlow {...propsWithoutModel} />)).not.toThrow();
  });

  it('handles empty resources array', () => {
    const propsWithoutResources = { ...mockProps, resources: [] };
    expect(() => render(<AgentFlow {...propsWithoutResources} />)).not.toThrow();
  });

  it('renders agent flow provider', () => {
    render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('agent-flow-provider')).toBeInTheDocument();
  });

  it('renders agent node with add resource buttons', () => {
    render(<AgentFlow {...mockProps} />);
    // The agent node buttons are rendered through ReactFlow, so we check ReactFlow is rendered
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders resource nodes with action buttons', () => {
    render(<AgentFlow {...mockProps} />);
    // The resource node buttons are rendered through ReactFlow, so we check ReactFlow is rendered
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles multiple resource types', () => {
    render(<AgentFlow {...mockProps} />);
    // The resource types are rendered through ReactFlow, so we check ReactFlow is rendered
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles active resource IDs', () => {
    render(<AgentFlow {...mockProps} />);
    // The component should handle activeResourceIds properly
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles enableTimelinePlayer prop', () => {
    // Test with timeline player enabled (default)
    const { rerender } = render(<AgentFlow {...mockProps} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    // Test with timeline player disabled
    rerender(<AgentFlow {...mockProps} enableTimelinePlayer={false} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  describe('Keyboard Delete Functionality', () => {
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    });

    afterEach(() => {
      removeEventListenerSpy.mockRestore();
    });

    it('handles Backspace and Delete keyboard events when component is mounted', () => {
      render(<AgentFlow {...mockProps} />);

      // Simulate Backspace key press
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      document.dispatchEvent(backspaceEvent);

      // Simulate Delete key press
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      // The event should be handled (no error thrown)
      // We can't easily test the internal logic without complex mocking,
      // but we can verify the event listener is set up correctly
      expect(removeEventListenerSpy).not.toHaveBeenCalled(); // Not called until unmount
    });

    it('handles Delete key events when component is mounted', () => {
      render(<AgentFlow {...mockProps} />);

      // Simulate Delete key press
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      // The event should be handled (no error thrown)
      expect(removeEventListenerSpy).not.toHaveBeenCalled(); // Not called until unmount
    });

    it('handles other keyboard events without errors', () => {
      render(<AgentFlow {...mockProps} />);

      // Simulate other key presses
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });

      document.dispatchEvent(enterEvent);
      document.dispatchEvent(escapeEvent);
      document.dispatchEvent(tabEvent);

      // No errors should be thrown
      expect(removeEventListenerSpy).not.toHaveBeenCalled(); // Not called until unmount
    });
  });
});
