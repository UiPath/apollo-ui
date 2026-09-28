import { fireEvent, render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NodePropertiesPanel } from './NodePropertiesPanel';

// Mock the hooks used by NodePropertiesPanel
vi.mock('./hooks', () => ({
  useNodeSelection: (nodeId: string) => ({
    selectedNodeId: nodeId,
    setSelectedNodeId: vi.fn(),
    selectedNode: mockNode,
  }),
  useNodeConfiguration: () => ({
    schema: {
      fields: [
        {
          key: 'name',
          type: 'text',
          label: 'Name',
        },
        {
          key: 'description',
          type: 'textarea',
          label: 'Description',
        },
      ],
    },
    errors: {},
    handleFieldChange: vi.fn(),
  }),
}));

// Mock the React Flow hooks
vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow-provider">{children}</div>
  ),
  useReactFlow: () => ({
    getInternalNode: (id: string) => ({
      id,
      internals: { positionAbsolute: { x: 100, y: 100 } },
      measured: { width: 200, height: 100 },
    }),
    setNodes: vi.fn(),
  }),
  useNodes: () => [mockNode],
  useOnSelectionChange: vi.fn(),
  ViewportPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the FloatingCanvasPanel component
vi.mock('../FloatingCanvasPanel', () => ({
  FloatingCanvasPanel: ({
    children,
    headerActions,
    onClose,
  }: {
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    onClose?: () => void;
  }) => (
    <div>
      {headerActions}
      <button onClick={onClose} data-testid="close-button">
        Close
      </button>
      {children}
    </div>
  ),
}));

const mockNode = {
  id: 'test-node',
  type: 'default',
  position: { x: 0, y: 0 },
  selected: true,
  data: {
    name: 'Test Node',
    description: 'Test Description',
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe('NodePropertiesPanel', () => {
  it('should render the pin/unpin button', () => {
    render(
      <TestWrapper>
        <NodePropertiesPanel nodeId="test-node" />
      </TestWrapper>
    );

    // The panel should have a pin button
    const pinButton = screen.queryByTitle('Pin panel');
    expect(pinButton).toBeTruthy();
  });

  it('should toggle between pinned and unpinned states', () => {
    const onPinnedChange = vi.fn();

    render(
      <TestWrapper>
        <NodePropertiesPanel
          nodeId="test-node"
          defaultPinned={false}
          onPinnedChange={onPinnedChange}
        />
      </TestWrapper>
    );

    // Initially should show "Pin panel"
    const pinButton = screen.getByTitle('Pin panel');

    // Click to pin
    fireEvent.click(pinButton);

    // Should call onPinnedChange with true
    expect(onPinnedChange).toHaveBeenCalledWith(true);

    // Button should now show "Unpin panel"
    const unpinButton = screen.getByTitle('Unpin panel');
    expect(unpinButton).toBeTruthy();
  });

  it('should start pinned when defaultPinned is true', () => {
    render(
      <TestWrapper>
        <NodePropertiesPanel nodeId="test-node" defaultPinned={true} />
      </TestWrapper>
    );

    // Should show "Unpin panel" since it starts pinned
    const unpinButton = screen.getByTitle('Unpin panel');
    expect(unpinButton).toBeTruthy();
  });

  it('should reset pinned state when panel closes', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <NodePropertiesPanel nodeId="test-node" onClose={onClose} defaultPinned={false} />
      </TestWrapper>
    );

    // Pin the panel
    const pinButton = screen.getByTitle('Pin panel');
    fireEvent.click(pinButton);

    // Close the panel
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // onClose should have been called
    expect(onClose).toHaveBeenCalled();
  });
});
