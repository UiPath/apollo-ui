import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasZoomControls } from './CanvasZoomControls';

const zoomIn = vi.fn();
const zoomOut = vi.fn();
const fitView = vi.fn();

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useReactFlow: () => ({ zoomIn, zoomOut, fitView }),
}));

let reducedMotion = false;

beforeEach(() => {
  reducedMotion = false;
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
});

afterEach(() => vi.unstubAllGlobals());

describe('CanvasZoomControls', () => {
  it('animates zoom and fit view when no options are passed', () => {
    render(<CanvasZoomControls />);

    fireEvent.click(screen.getByTestId('zoom-in-button'));
    fireEvent.click(screen.getByTestId('zoom-out-button'));
    fireEvent.click(screen.getByTestId('fit-to-view-button'));

    expect(zoomIn).toHaveBeenCalledWith({ duration: 200 });
    expect(zoomOut).toHaveBeenCalledWith({ duration: 200 });
    expect(fitView).toHaveBeenCalledWith({ padding: 0.1, duration: 300 });
  });

  it('drops every duration to 0 under reduced motion', () => {
    reducedMotion = true;
    render(<CanvasZoomControls fitViewOptions={{ duration: 500, maxZoom: 1 }} />);

    fireEvent.click(screen.getByTestId('zoom-in-button'));
    fireEvent.click(screen.getByTestId('fit-to-view-button'));

    expect(zoomIn).toHaveBeenCalledWith({ duration: 0 });
    expect(fitView).toHaveBeenCalledWith({ padding: 0.1, duration: 0, maxZoom: 1 });
  });

  it('lays the options the caller passes over the defaults', () => {
    render(
      <CanvasZoomControls zoomInOptions={{ duration: 50 }} fitViewOptions={{ padding: 0.2 }} />
    );

    fireEvent.click(screen.getByTestId('zoom-in-button'));
    fireEvent.click(screen.getByTestId('fit-to-view-button'));

    expect(zoomIn).toHaveBeenCalledWith({ duration: 50 });
    expect(fitView).toHaveBeenCalledWith({ padding: 0.2, duration: 300 });
  });
});
