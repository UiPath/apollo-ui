import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  SequencedContainersProvider,
  type SequencedContainersValue,
} from '../SequentialCanvas/SequencedContainersContext';
import { ContainerBodyViewSwitch } from './ContainerBodyViewSwitch';

function makeValue(overrides: Partial<SequencedContainersValue> = {}): SequencedContainersValue {
  return {
    isSequenced: () => false,
    canSequence: () => true,
    setSequenced: vi.fn(),
    ...overrides,
  };
}

function renderSwitch(value: SequencedContainersValue, onOuterClick = vi.fn()) {
  render(
    <div onClick={onOuterClick} onMouseDown={onOuterClick}>
      <SequencedContainersProvider value={value}>
        <ContainerBodyViewSwitch containerId="c1" />
      </SequencedContainersProvider>
    </div>
  );
  return onOuterClick;
}

describe('ContainerBodyViewSwitch', () => {
  it('renders nothing outside a sequenced-containers canvas', () => {
    render(<ContainerBodyViewSwitch containerId="c1" />);
    expect(screen.queryByTestId('container-body-view-switch')).toBeNull();
  });

  it('renders nothing when the body cannot be sequenced', () => {
    renderSwitch(makeValue({ canSequence: () => false }));
    expect(screen.queryByTestId('container-body-view-switch')).toBeNull();
  });

  it('offers flow and sequence, reflecting the current body view', () => {
    renderSwitch(makeValue({ isSequenced: (id) => id === 'c1' }));
    expect(screen.getByRole('radio', { name: 'Flow' })).toHaveAttribute('data-state', 'off');
    expect(screen.getByRole('radio', { name: 'Sequence' })).toHaveAttribute('data-state', 'on');
  });

  it('calls setSequenced with the container id and the chosen view', () => {
    const value = makeValue();
    renderSwitch(value);

    fireEvent.click(screen.getByRole('radio', { name: 'Sequence' }));
    expect(value.setSequenced).toHaveBeenCalledWith('c1', true);
  });

  it('ignores re-pressing the active item', () => {
    const value = makeValue();
    renderSwitch(value);

    fireEvent.click(screen.getByRole('radio', { name: 'Flow' }));
    expect(value.setSequenced).not.toHaveBeenCalled();
  });

  it('does not bubble clicks or mousedown to the node', () => {
    const outer = renderSwitch(makeValue());

    const item = screen.getByRole('radio', { name: 'Sequence' });
    fireEvent.mouseDown(item);
    fireEvent.click(item);
    expect(outer).not.toHaveBeenCalled();
  });
});
