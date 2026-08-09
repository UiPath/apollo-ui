import { render } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { HANDLE_CROSS_AXIS_SIZE_PX } from '../ButtonHandle/ButtonHandleStyleUtils';
import { StageNodeHandles } from './StageNodeHandles';

const mocks = vi.hoisted(() => ({
  connectedHandleIds: new Set<string>(),
  reactFlowState: {
    connection: {
      inProgress: false,
    },
  },
  useButtonHandles: vi.fn(() => null),
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
  useStore: (selector: (state: typeof mocks.reactFlowState) => unknown) =>
    selector(mocks.reactFlowState),
}));

vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({
  useConnectedHandles: () => mocks.connectedHandleIds,
}));

vi.mock('../ButtonHandle/useButtonHandles', () => ({
  useButtonHandles: mocks.useButtonHandles,
}));

const renderHandles = () =>
  render(<StageNodeHandles id="stage-1" isReadOnly={false} selected={false} isHovered={false} />);

describe('StageNodeHandles', () => {
  beforeEach(() => {
    mocks.reactFlowState.connection.inProgress = false;
    mocks.connectedHandleIds.clear();
    mocks.useButtonHandles.mockClear();
  });

  it('shows its handles during a drag-to-connect gesture', () => {
    mocks.reactFlowState.connection.inProgress = true;

    renderHandles();

    expect(mocks.useButtonHandles).toHaveBeenCalledWith(
      expect.objectContaining({ shouldShowHandles: true })
    );
  });

  it('uses a square hit area for the bottom return-edge target', () => {
    renderHandles();

    const { handleConfigurations } = mocks.useButtonHandles.mock.calls.at(-1)?.[0] as {
      handleConfigurations: HandleGroupManifest[];
    };
    const bottomTarget = handleConfigurations.find(
      (configuration) =>
        configuration.position === Position.Bottom &&
        configuration.handles.some((handle) => handle.type === 'target')
    );

    expect(bottomTarget?.customPositionAndOffsets).toEqual({
      width: HANDLE_CROSS_AXIS_SIZE_PX,
    });
  });
});
