import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
import { CanvasPanelSurface } from './CanvasPanelSurface';

const surface = () => document.querySelector('[data-slot="canvas-panel-surface"]') as HTMLElement;

describe('CanvasPanelSurface', () => {
  it('renders children through the panel chrome', () => {
    render(
      <CanvasPanelSurface>
        <div data-testid="content">body</div>
      </CanvasPanelSurface>
    );

    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    // Chrome wraps children in its own scroll container rather than dropping
    // them straight onto the surface.
    expect(content.parentElement).not.toBe(surface());
    expect(surface().contains(content)).toBe(true);
  });

  it('carries the floating shell chrome', () => {
    render(<CanvasPanelSurface />);

    // The radius/shadow pair is what makes the surface read as a raised panel,
    // and the future variant rounds it a step further.
    expect(surface()).toHaveClass('rounded-lg', 'future:rounded-2xl');
    expect(surface().className).toContain('shadow-[0_4px_16px_rgba(0,0,0,0.12)]');
  });

  it('applies caller classes without dropping its own chrome', () => {
    render(<CanvasPanelSurface className="mx-auto w-fit" />);

    expect(surface()).toHaveClass('mx-auto', 'w-fit');
    expect(surface()).toHaveClass('rounded-lg');
  });

  it('forwards the ref to the surface element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CanvasPanelSurface ref={ref} />);

    // FloatingCanvasPanel hands floating-ui this ref to position the panel, so
    // it has to land on the outermost element.
    expect(ref.current).toBe(surface());
  });

  it('forwards pointer enter and leave handlers', () => {
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    render(<CanvasPanelSurface onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} />);

    fireEvent.pointerEnter(surface());
    fireEvent.pointerLeave(surface());

    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
  });

  it('passes positioning styles straight through', () => {
    render(<CanvasPanelSurface style={{ position: 'absolute', top: 12, zIndex: 1100 }} />);

    expect(surface()).toHaveStyle({ position: 'absolute', top: '12px', zIndex: '1100' });
  });

  it('forwards chrome props such as scrollableContent', () => {
    render(
      <CanvasPanelSurface scrollableContent={false}>
        <div data-testid="content">body</div>
      </CanvasPanelSurface>
    );

    // Toolbox-style content owns its own virtualized scroll, so the chrome's
    // outer scroll has to be suppressible from the surface.
    expect(screen.getByTestId('content').parentElement).toHaveClass('overflow-y-hidden');
  });
});
