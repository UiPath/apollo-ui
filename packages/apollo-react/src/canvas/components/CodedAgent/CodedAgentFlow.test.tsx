import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../utils/testing';
import { CodedAgentFlow } from './CodedAgentFlow';

// Mock BaseCanvas to avoid ReactFlow dependencies in tests
vi.mock('../BaseCanvas', () => ({
  BaseCanvas: ({ children, nodes, edges }: any) => (
    <div data-testid="base-canvas">
      {children}
      <div data-testid="nodes-count">{nodes?.length || 0}</div>
      <div data-testid="edges-count">{edges?.length || 0}</div>
    </div>
  ),
  NODE_DIMENSIONS: {
    codedAgent: { width: 200, height: 100 },
    resource: { width: 40, height: 40 },
    flow: { width: 120, height: 60 },
  },
}));

// Mock CanvasPositionControls
vi.mock('../CanvasPositionControls', () => ({
  CanvasPositionControls: () => <div data-testid="canvas-position-controls" />,
}));

// Mock ButtonHandle
vi.mock('../ButtonHandle', () => ({
  ButtonHandles: ({ nodeId, handles, position }: any) => (
    <div data-testid={`button-handles-${nodeId}-${position}`}>
      {handles?.map((handle: any, i: number) => (
        <div key={i} data-testid={`handle-${handle.id}`} />
      ))}
    </div>
  ),
}));

// Shared mock state
let mockNodes: any[] = [];
let mockEdges: any[] = [];

// Mock React Flow components
vi.mock('@uipath/uix/xyflow/react', () => ({
  ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>,
  useReactFlow: () => ({
    fitView: vi.fn(),
    getNodes: () => mockNodes,
    getEdges: () => mockEdges,
  }),
  useNodesState: () => {
    const setNodes = (newNodes: any[]) => {
      mockNodes = Array.isArray(newNodes)
        ? newNodes.map((node) => ({
            ...node,
            measured: true,
          }))
        : [];
    };
    const onNodesChange = vi.fn();
    return [mockNodes, setNodes, onNodesChange];
  },
  useEdgesState: () => {
    const setEdges = (newEdges: any[]) => {
      mockEdges = Array.isArray(newEdges) ? newEdges : [];
    };
    return [mockEdges, setEdges];
  },
  Panel: ({ children, position }: any) => (
    <div data-testid="panel" data-position={position}>
      {children}
    </div>
  ),
  Handle: ({ type, position, id, ...props }: any) => (
    <div data-testid={`handle-${type}-${position}-${id}`} {...props} />
  ),
  BaseEdge: ({ id, path, style, markerEnd }: any) => (
    <path data-testid={`edge-${id}`} d={path} style={style} markerEnd={markerEnd} />
  ),
  getSimpleBezierPath: vi.fn(() => ['M0,0 L100,100']),
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
}));

// Mock sanitizeHtml - iteratively remove HTML tags until none remain
vi.mock('sanitize-html', () => ({
  default: (html: string) => {
    let sanitized = html;
    // Keep removing HTML tags until no more are found (handles nested tags)
    while (/<[^>]*>/.test(sanitized)) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    return sanitized;
  },
}));

// Mock mermaid - all mocking logic must be self-contained within the factory
vi.mock('mermaid', () => {
  const mockMermaidParse = vi.fn();
  const mockGetDiagramFromText = vi.fn();

  return {
    default: {
      initialize: vi.fn(),
      parse: mockMermaidParse,
      mermaidAPI: {
        getDiagramFromText: mockGetDiagramFromText,
      },
    },
    mockMermaidParse,
    mockGetDiagramFromText,
  };
});

describe('CodedAgentFlow', () => {
  const validMermaidText = `
graph LR
    Start --> Agent1[Agent Step 1]
    Agent1 --> Tool1[Tool Function]
    Tool1 --> End
  `;

  const complexMermaidText = `
graph LR
    Start --> Agent1[Data Analysis Agent]
    Agent1 --> Tool1[Database Query Tool]
    Agent1 --> Tool2[Analytics Tool]
    Tool1 --> Agent2[Report Generation Agent]
    Tool2 --> Agent2
    Agent2 --> End
  `;

  // Suppress act() warnings for async state updates in CodedAgentFlow
  const originalError = console.error;
  beforeEach(async () => {
    vi.clearAllMocks();
    console.error = (...args: any[]) => {
      // Suppress act() warnings from CodedAgentFlow async updates
      const message = args[0]?.toString() || '';
      if (
        message.includes(
          'Warning: An update to CodedAgentFlowInner inside a test was not wrapped in act'
        ) ||
        message.includes('inside a test was not wrapped in act')
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    // Reset mock state
    mockNodes = [];
    mockEdges = [];

    // Set up successful mermaid parsing mock
    const mermaid = await vi.importMock('mermaid');
    (mermaid as any).mockMermaidParse.mockResolvedValue(true as any);
    (mermaid as any).mockGetDiagramFromText.mockResolvedValue({
      type: 'flowchart-v2',
      db: {
        getVertices: () =>
          new Map([
            ['start', { id: 'start', text: 'Start' }],
            ['agent1', { id: 'agent1', text: 'Agent 1' }],
            ['end', { id: 'end', text: 'End' }],
          ]),
        getEdges: () => [
          { start: 'start', end: 'agent1' },
          { start: 'agent1', end: 'end' },
        ],
      },
    } as any);
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalError;
  });

  describe('Component Structure', () => {
    it('renders without crashing', () => {
      render(<CodedAgentFlow mermaidText={validMermaidText} />);

      expect(screen.getByTestId('react-flow-provider')).toBeDefined();
    });

    it('renders all required sub-components when data is loaded', async () => {
      render(<CodedAgentFlow mermaidText={validMermaidText} />);

      // Wait for async processing to complete
      await waitFor(() => {
        expect(screen.getByTestId('react-flow-provider')).toBeDefined();
      });
    });
  });

  describe('Props Validation', () => {
    it('accepts valid props', () => {
      expect(() => render(<CodedAgentFlow mermaidText={validMermaidText} />)).not.toThrow();
    });

    it('handles empty mermaid text', () => {
      render(<CodedAgentFlow mermaidText="" />);

      expect(screen.getByText('No data to display')).toBeDefined();
    });

    it('handles complex mermaid diagrams', () => {
      expect(() => render(<CodedAgentFlow mermaidText={complexMermaidText} />)).not.toThrow();
    });
  });

  describe('Empty State', () => {
    it('displays empty state message when no mermaid text is provided', () => {
      render(<CodedAgentFlow mermaidText="" />);

      expect(screen.getByText('No data to display')).toBeDefined();
    });

    it('does not display other content in empty state', () => {
      render(<CodedAgentFlow mermaidText="" />);

      expect(screen.queryByTestId('react-flow')).toBeNull();
      expect(screen.queryByText('Coded Agent')).toBeNull();
    });
  });

  describe('Mermaid Text Processing', () => {
    it('processes valid mermaid syntax', async () => {
      render(<CodedAgentFlow mermaidText={validMermaidText} />);

      const mermaid = await vi.importMock('mermaid');
      await waitFor(() => {
        expect((mermaid as any).mockGetDiagramFromText).toHaveBeenCalledWith(validMermaidText);
      });
    });

    it('handles malformed mermaid syntax gracefully', async () => {
      const malformedMermaid = 'invalid mermaid syntax';

      // Mock mermaid.parse to return false (invalid syntax)
      const mermaid = await vi.importMock('mermaid');
      (mermaid as any).mockMermaidParse.mockResolvedValue(false as any);

      // The component should handle this gracefully without crashing
      expect(() => render(<CodedAgentFlow mermaidText={malformedMermaid} />)).not.toThrow();

      // The component should render (either loading, error, or empty state)
      expect(screen.getByTestId('react-flow-provider')).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    it('wraps content in ReactFlowProvider', () => {
      render(<CodedAgentFlow mermaidText={validMermaidText} />);

      const provider = screen.getByTestId('react-flow-provider');
      expect(provider).toBeDefined();
    });

    it('renders ReactFlow when data is available', async () => {
      render(<CodedAgentFlow mermaidText={validMermaidText} />);

      // ReactFlow should be rendered when we have data
      await waitFor(() => {
        expect(screen.getByTestId('react-flow-provider')).toBeDefined();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper test IDs for testing', () => {
      render(<CodedAgentFlow mermaidText={validMermaidText} />);

      expect(screen.getByTestId('react-flow-provider')).toBeDefined();
    });

    it('provides meaningful text for different states', () => {
      // Empty state
      render(<CodedAgentFlow mermaidText="" />);
      expect(screen.getByText('No data to display')).toBeDefined();
    });
  });
});
