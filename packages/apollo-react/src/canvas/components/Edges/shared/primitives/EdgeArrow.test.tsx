import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EdgeArrow } from './EdgeArrow';

function renderArrow(props: Partial<React.ComponentProps<typeof EdgeArrow>> = {}) {
  const { container } = render(
    <svg>
      <EdgeArrow
        target={{ x: 100, y: 50 }}
        angle={0}
        offset={{ x: 8, y: 0 }}
        color="var(--canvas-border)"
        {...props}
      />
    </svg>
  );
  return container.querySelector('polygon') as SVGPolygonElement;
}

/** Locks the arrow-head geometry the legacy SequenceEdge rendered inline. */
describe('EdgeArrow', () => {
  it('places the tip at the target point and insets via the offset transform', () => {
    const polygon = renderArrow();
    // first point of the triangle is the tip
    expect(polygon.getAttribute('points')?.startsWith('100,50 ')).toBe(true);
    expect(polygon.style.transform).toBe('translate(8px, 0px)');
    expect(polygon.style.pointerEvents).toBe('none');
  });

  it('fills with the resolved edge color at the given opacity', () => {
    const polygon = renderArrow({ color: 'var(--canvas-error-icon)', opacity: 0.5 });
    expect(polygon.getAttribute('fill')).toBe('var(--canvas-error-icon)');
    expect(polygon.style.opacity).toBe('0.5');
  });

  it('rotates the wings with the entry angle', () => {
    // angle 0 (entering the target's left face) puts both wings left of the tip
    const horizontal = renderArrow({ angle: 0 }).getAttribute('points')!;
    const [, leftWing, rightWing] = horizontal.split(' ');
    expect(Number.parseFloat(leftWing!.split(',')[0]!)).toBeLessThan(100);
    expect(Number.parseFloat(rightWing!.split(',')[0]!)).toBeLessThan(100);

    // angle PI/2 (entering the top face) puts both wings above the tip
    const vertical = renderArrow({ angle: Math.PI / 2 }).getAttribute('points')!;
    const [, upLeft, upRight] = vertical.split(' ');
    expect(Number.parseFloat(upLeft!.split(',')[1]!)).toBeLessThan(50);
    expect(Number.parseFloat(upRight!.split(',')[1]!)).toBeLessThan(50);
  });
});
