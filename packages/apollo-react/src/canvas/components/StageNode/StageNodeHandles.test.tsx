import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HANDLE_DRAG_THRESHOLD } from '../../constants';
import { fireEvent, render, screen } from '../../utils/testing';
import type { HandleActionEvent } from '../ButtonHandle';
import { StageNode } from './StageNode';
import type { StageNodeProps } from './StageNode.types';

const { mockState } = vi.hoisted(() => ({
  mockState: {
    isConnecting: false,
    multipleNodesSelected: false,
    connectedHandleIds: new Set<string>(),
  },
}));

vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({
  useConnectedHandles: () => mockState.connectedHandleIds,
}));

vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => ({ multipleNodesSelected: mockState.multipleNodesSelected }),
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  useStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      transform: [0, 0, 1],
      connection: { inProgress: mockState.isConnecting },
      connectionClickStartHandle: null,
    }),
}));

const defaultProps = {
  dragging: false,
  selected: false,
  id: 'stage-1',
  width: 300,
  stageDetails: { label: 'Test Stage', tasks: [] },
} as StageNodeProps;

const renderStage = (props: Partial<StageNodeProps> = {}) =>
  render(
    <ReactFlowProvider>
      <StageNode {...defaultProps} {...props} />
    </ReactFlowProvider>
  );

const queryAddButton = () => screen.queryByRole('button', { name: 'Add node' });
const hoverStage = () => fireEvent.mouseEnter(screen.getByTestId('stage-stage-1'));

describe('StageNode handle add button', () => {
  beforeEach(() => {
    mockState.isConnecting = false;
    mockState.multipleNodesSelected = false;
    mockState.connectedHandleIds = new Set();
  });

  it('renders no add button without onHandleAction', () => {
    renderStage({ selected: true });
    hoverStage();

    expect(queryAddButton()).not.toBeInTheDocument();
  });

  it('stays hidden until the stage is hovered or selected', () => {
    renderStage({ onHandleAction: vi.fn() });

    expect(queryAddButton()).not.toBeInTheDocument();
  });

  it('shows the add button on hover', () => {
    renderStage({ onHandleAction: vi.fn() });
    hoverStage();

    expect(queryAddButton()).toBeInTheDocument();
  });

  it('shows the add button on selection', () => {
    renderStage({ onHandleAction: vi.fn(), selected: true });

    expect(queryAddButton()).toBeInTheDocument();
  });

  it('shows a single add button, on the right source handle', () => {
    renderStage({ onHandleAction: vi.fn(), selected: true });

    const buttons = screen.getAllByRole('button', { name: 'Add node' });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.closest('.react-flow__handle')).toHaveAttribute(
      'data-handleid',
      'stage-1____source____right'
    );
  });

  it.each<[string, Partial<StageNodeProps>, Partial<typeof mockState>]>([
    ['read-only', { stageDetails: { label: 'Test Stage', tasks: [], isReadOnly: true } }, {}],
    ['multiple nodes are selected', {}, { multipleNodesSelected: true }],
    ['a connection is in progress', {}, { isConnecting: true }],
    ['the stage is being dragged', { dragging: true }, {}],
  ])('hides the add button when %s', (_name, props, state) => {
    Object.assign(mockState, state);
    renderStage({ onHandleAction: vi.fn(), selected: true, ...props });
    hoverStage();

    expect(queryAddButton()).not.toBeInTheDocument();
  });

  it('renders no handles or add button on an exception stage', () => {
    const { container } = renderStage({
      onHandleAction: vi.fn(),
      selected: true,
      stageDetails: { label: 'Test Stage', tasks: [], isException: true },
    });
    hoverStage();

    expect(queryAddButton()).not.toBeInTheDocument();
    expect(container.querySelector('.react-flow__handle')).not.toBeInTheDocument();
  });

  it('calls onHandleAction with the right source handle on click', () => {
    const onHandleAction = vi.fn<(event: HandleActionEvent) => void>();
    renderStage({ onHandleAction, selected: true });

    const button = screen.getByRole('button', { name: 'Add node' });
    fireEvent.pointerDown(button, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(document);
    fireEvent.click(button);

    expect(onHandleAction).toHaveBeenCalledOnce();
    expect(onHandleAction).toHaveBeenCalledWith(
      expect.objectContaining({
        handleId: 'stage-1____source____right',
        nodeId: 'stage-1',
        handleType: 'output',
      })
    );
  });

  it('does not call onHandleAction after a drag past the threshold', () => {
    const onHandleAction = vi.fn();
    renderStage({ onHandleAction, selected: true });

    const button = screen.getByRole('button', { name: 'Add node' });
    fireEvent.pointerDown(button, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(document, { clientX: 100 + HANDLE_DRAG_THRESHOLD + 1, clientY: 100 });
    fireEvent.pointerUp(document);
    fireEvent.click(button);

    expect(onHandleAction).not.toHaveBeenCalled();
  });

  it('sets the add button title from handleAddButtonTitle', () => {
    renderStage({
      onHandleAction: vi.fn(),
      selected: true,
      handleAddButtonTitle: 'Click to add · Drag to connect',
    });

    expect(queryAddButton()).toHaveAttribute('title', 'Click to add · Drag to connect');
  });

  it('keeps a connected handle visible while the stage is idle', () => {
    mockState.connectedHandleIds = new Set(['stage-1____source____right']);
    const { container } = renderStage({ onHandleAction: vi.fn() });

    const handle = (handleId: string) =>
      container.querySelector(`.react-flow__handle[data-handleid="${handleId}"]`);
    expect(handle('stage-1____source____right')).toHaveClass('opacity-100');
    expect(handle('stage-1____target____left')).toHaveClass('opacity-0');
    expect(queryAddButton()).not.toBeInTheDocument();
  });
});
