import { fireEvent, render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { LoopNodeData } from './LoopNode.types';

const { mockManifest } = vi.hoisted(() => ({
  mockManifest: {
    current: {
      display: { label: 'Loop', icon: 'repeat', shape: 'container' },
      handleConfiguration: [],
    } as Record<string, unknown>,
  },
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  useStore: (selector: unknown) => {
    const state = {
      connection: { inProgress: false },
      nodes: [],
      parentLookup: new Map(),
    };

    return typeof selector === 'function' ? selector(state) : false;
  },
  useUpdateNodeInternals: () => vi.fn(),
}));

vi.mock('../../core', () => ({
  useOptionalNodeTypeRegistry: () => ({
    getManifest: () => mockManifest.current,
  }),
}));

vi.mock('../../hooks', () => ({
  useNodeExecutionState: () => undefined,
  useElementValidationStatus: () => undefined,
}));

vi.mock('../../utils/icon-registry', () => ({
  CanvasIcon: ({ icon }: { icon: string }) => <span data-testid={`canvas-icon-${icon}`} />,
}));

vi.mock('../../utils/toolbar-resolver', () => ({
  resolveToolbar: () => undefined,
}));

vi.mock('../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => ({ mode: 'design' }),
}));

vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({
  useConnectedHandles: () => new Set(),
}));

vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => ({ multipleNodesSelected: false }),
}));

import { LoopNode } from './LoopNode';

const defaultProps: NodeProps<Node<LoopNodeData>> = {
  id: 'loop-1',
  type: 'loop',
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

function renderLoopNode(props: Partial<React.ComponentProps<typeof LoopNode>> = {}) {
  render(<LoopNode {...defaultProps} {...props} />);
  return screen.getByTestId('loop-node-header');
}

function getLoopContainer() {
  return document.querySelector('[data-loop-container]') as HTMLElement;
}

describe('LoopNode header adornment spacing', () => {
  it('keeps the default header padding when no adornments are visible', () => {
    const header = renderLoopNode();

    expect(header.style.paddingLeft).toBe('');
    expect(header.style.paddingRight).toBe('');
  });

  it('reserves left-side header space when the top-left adornment is visible', () => {
    const header = renderLoopNode({
      adornments: {
        topLeft: <span data-testid="breakpoint-adornment" />,
      },
    });

    expect(header.style.paddingLeft).toBe('34px');
    expect(header.style.paddingRight).toBe('');
  });

  it('reserves right-side header space when the top-right adornment is visible', () => {
    const header = renderLoopNode({
      adornments: {
        topRight: <span data-testid="execution-count-adornment" />,
      },
    });

    expect(header.style.paddingLeft).toBe('');
    expect(header.style.paddingRight).toBe('34px');
  });

  it('reserves both sides independently when both top adornments are visible', () => {
    const header = renderLoopNode({
      adornments: {
        topLeft: <span data-testid="breakpoint-adornment" />,
        topRight: <span data-testid="execution-count-adornment" />,
      },
    });

    expect(header.style.paddingLeft).toBe('34px');
    expect(header.style.paddingRight).toBe('34px');
  });
});

describe('LoopNode status border hover treatment', () => {
  it('preserves a resolved status border while hovered', () => {
    renderLoopNode({ executionStatusOverride: 'Completed' });

    const container = getLoopContainer();
    fireEvent.mouseEnter(container);

    expect(container).toHaveClass('border-success');
    expect(container).toHaveClass('shadow-(--canvas-node-shadow-hover)');
    expect(container).not.toHaveClass('border-border-hover');
  });

  it('keeps the hover border for neutral statuses without a resolved status border', () => {
    renderLoopNode({ executionStatusOverride: 'NotExecuted' });

    const container = getLoopContainer();
    fireEvent.mouseEnter(container);

    expect(container).toHaveClass('border-border-hover');
    expect(container).toHaveClass('shadow-(--canvas-node-shadow-hover)');
  });
});
