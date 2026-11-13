import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
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

const hoverStage = () => fireEvent.mouseEnter(screen.getByTestId('stage-stage-1'));

describe('StageNode interaction states', () => {
  // Emotion's declarations for the container, in source order (later wins).
  const containerCss = () => {
    const classNames = [...screen.getByTestId('stage-container-stage-1').classList];
    // Raw text rather than CSSOM: jsdom drops shorthands whose value is a var().
    return [...document.querySelectorAll('style[data-emotion]')]
      .map((style) => style.textContent ?? '')
      .filter((text) => classNames.some((name) => text.startsWith(`.${name}{`)))
      .join('\n');
  };
  const lastValue = (property: string) =>
    [...containerCss().matchAll(new RegExp(`[{;\\s]${property}:\\s*([^;]+);`, 'g'))].at(-1)?.[1];

  it('rests with the rest shadow and no outline', () => {
    renderStage();

    expect(lastValue('box-shadow')).toBe('var(--canvas-node-shadow-rest)');
    expect(lastValue('outline')).toBeUndefined();
  });

  it('raises the shadow and border on hover', () => {
    renderStage();
    hoverStage();

    expect(lastValue('box-shadow')).toBe('var(--canvas-node-shadow-hover)');
    expect(lastValue('border-color')).toBe('var(--canvas-border-hover)');
  });

  it('draws the accent outline when selected', () => {
    renderStage({ selected: true });

    expect(lastValue('outline')).toBe('2px solid var(--canvas-primary-hover)');
  });

  it('lifts the shadow while dragging', () => {
    renderStage({ selected: true, dragging: true });

    expect(lastValue('box-shadow')).toBe('var(--canvas-node-shadow-lifted)');
  });

  it('keeps the status border colour on hover', () => {
    renderStage({ execution: { stageStatus: { status: 'Completed' }, taskStatus: {} } });
    hoverStage();

    expect(lastValue('border-color')).toBe('var(--canvas-success-icon)');
  });
});
