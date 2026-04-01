import { render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { BaseNodeData } from './BaseNode.types';

// xyflow is globally mocked in canvas-mocks.ts; extend with updateNode.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  useStore: () => false,
  useUpdateNodeInternals: () => vi.fn(),
  useReactFlow: () => ({ updateNodeData: vi.fn(), updateNode: vi.fn() }),
}));

vi.mock('../../hooks', () => ({
  useNodeExecutionState: () => undefined,
  useElementValidationStatus: () => undefined,
}));

vi.mock('../../core', () => ({
  useNodeTypeRegistry: () => ({
    getManifest: () => ({
      display: { label: 'Test Node', shape: 'square', icon: 'test-icon' },
      handleConfiguration: [],
    }),
  }),
}));

vi.mock('../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => ({ mode: 'design' }),
}));
vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({ useConnectedHandles: () => new Set() }));
vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => ({ multipleNodesSelected: false }),
}));
vi.mock('../BaseCanvas/CanvasThemeContext', () => ({
  useCanvasTheme: () => ({ isDarkMode: false }),
}));
vi.mock('../ButtonHandle/useButtonHandles', () => ({ useButtonHandles: () => null }));
vi.mock('../ButtonHandle/SmartHandle', () => ({
  SmartHandle: () => null,
  SmartHandleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./BaseNodeConfigContext', () => ({ useBaseNodeOverrideConfig: () => ({}) }));
vi.mock('../../utils/adornment-resolver', () => ({ resolveAdornments: () => ({}) }));
vi.mock('../../utils/toolbar-resolver', () => ({ resolveToolbar: () => undefined }));
vi.mock('@uipath/apollo-react/material/components', () => ({ ApIcon: () => null }));
vi.mock('@uipath/apollo-react/canvas/utils', () => ({
  cx: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));
vi.mock('../../utils/icon-registry', () => ({
  getIcon: () => () => <div data-testid="node-icon">Icon</div>,
}));
vi.mock('../../utils/manifest-resolver', () => ({
  resolveDisplay: (display: Record<string, unknown> | undefined) => ({
    label: 'Test Node',
    subLabel: 'Test SubLabel',
    shape: 'square',
    icon: 'test-icon',
    ...display,
  }),
  resolveHandles: () => [],
}));

vi.mock('./NodeLabel', () => ({
  NodeLabel: ({ label }: { label?: string }) => <div data-testid="node-label">{label}</div>,
}));

import { BaseNode } from './BaseNode';

const defaultProps: NodeProps<Node<BaseNodeData>> = {
  id: 'test-node',
  type: 'test',
  data: {},
  selected: false,
  dragging: false,
  draggable: true,
  zIndex: 0,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  selectable: true,
  deletable: true,
};

describe('BaseNode', () => {
  describe('Loading state', () => {
    it.each([
      { loading: true, expectSkeleton: true },
      { loading: false, expectSkeleton: false },
      { loading: undefined, expectSkeleton: false },
    ])('renders skeleton=$expectSkeleton when loading=$loading', ({ loading, expectSkeleton }) => {
      const data = loading !== undefined ? { loading } : {};
      render(<BaseNode {...defaultProps} data={data} />);

      if (expectSkeleton) {
        expect(screen.getByTestId('ap-skeleton')).toBeInTheDocument();
        expect(screen.queryByTestId('node-icon')).not.toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('ap-skeleton')).not.toBeInTheDocument();
        expect(screen.getByTestId('node-icon')).toBeInTheDocument();
      }
    });

    it('still renders label when loading', () => {
      render(<BaseNode {...defaultProps} data={{ loading: true }} />);

      expect(screen.getByTestId('ap-skeleton')).toBeInTheDocument();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });
  });
});
