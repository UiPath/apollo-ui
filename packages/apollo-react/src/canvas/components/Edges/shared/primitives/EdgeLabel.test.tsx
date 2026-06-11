import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EdgeLabel } from './EdgeLabel';

function renderLabel(props: Partial<React.ComponentProps<typeof EdgeLabel>> = {}) {
  const { container } = render(
    <svg>
      <EdgeLabel x={150} y={50} text="Run" {...props} />
    </svg>
  );
  return {
    foreignObject: container.querySelector('foreignObject'),
    label: container.querySelector('.react-flow__edge-label') as HTMLDivElement,
  };
}

/** Locks the label markup the legacy SequenceEdge rendered inline. */
describe('EdgeLabel', () => {
  it('renders the text centered on the given point, opted out of pan/drag', () => {
    const { foreignObject, label } = renderLabel();
    expect(label.textContent).toBe('Run');
    expect(foreignObject?.getAttribute('x')).toBe('150');
    expect(foreignObject?.getAttribute('y')).toBe('50');
    expect(label.className).toContain('nodrag');
    expect(label.className).toContain('nopan');
    expect(label.style.transform).toBe('translate(-50%, -50%)');
    expect(label.style.pointerEvents).toBe('none');
  });

  it('uses the primary border when selected and the default border otherwise', () => {
    // assert on the raw attribute — happy-dom's border shorthand drops var() colors
    expect(renderLabel().label.getAttribute('style')).toContain('var(--canvas-border)');
    expect(renderLabel({ selected: true }).label.getAttribute('style')).toContain(
      'var(--canvas-primary)'
    );
  });
});
