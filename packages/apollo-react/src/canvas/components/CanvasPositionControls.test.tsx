import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DefaultCanvasTranslations } from '../types';
import { CanvasPositionControls } from './CanvasPositionControls';

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

const click = (label: string) => fireEvent.click(screen.getByLabelText(label));

describe('CanvasPositionControls', () => {
  it('animates zoom and fit view like CanvasZoomControls', () => {
    render(
      <CanvasPositionControls
        translations={DefaultCanvasTranslations}
        zoomOutOptions={{ duration: 50 }}
      />
    );

    click(DefaultCanvasTranslations.zoomIn);
    click(DefaultCanvasTranslations.zoomOut);
    click(DefaultCanvasTranslations.zoomToFit);

    expect(zoomIn).toHaveBeenCalledWith({ duration: 200 });
    expect(zoomOut).toHaveBeenCalledWith({ duration: 50 });
    expect(fitView).toHaveBeenCalledWith({ padding: 0.1, duration: 300 });
  });

  it('drops every duration to 0 under reduced motion', () => {
    reducedMotion = true;
    render(<CanvasPositionControls translations={DefaultCanvasTranslations} />);

    click(DefaultCanvasTranslations.zoomIn);
    click(DefaultCanvasTranslations.zoomToFit);

    expect(zoomIn).toHaveBeenCalledWith({ duration: 0 });
    expect(fitView).toHaveBeenCalledWith({ padding: 0.1, duration: 0 });
  });
});
