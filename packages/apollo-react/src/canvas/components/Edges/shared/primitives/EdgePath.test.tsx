import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EdgePath } from './EdgePath';

const D = 'M 0 0 L 100 0';

function renderPath(props: Partial<React.ComponentProps<typeof EdgePath>> = {}) {
  const { container } = render(
    <svg>
      <EdgePath d={D} color="var(--canvas-border)" {...props} />
    </svg>
  );
  return {
    visible: container.querySelector('.react-flow__edge-path') as SVGPathElement,
    interaction: container.querySelector('.react-flow__edge-interaction') as SVGPathElement,
    outline: container.querySelector('.react-flow__edge-outline') as SVGPathElement | null,
  };
}

/**
 * Locks the visual contract the legacy SequenceEdge path stack implemented
 * inline. Values are asserted as literals on purpose: retuning a shared
 * constant changes this published contract and should fail here, not slide
 * through silently.
 */
describe('EdgePath', () => {
  it('renders solid by default and dashed for strokeStyle="dashed"', () => {
    expect(renderPath().visible.style.strokeDasharray).toBe('0');
    expect(renderPath({ strokeStyle: 'dashed' }).visible.style.strokeDasharray).toBe('5,5');
  });

  it('sets no dasharray when animated, so React Flow dash animation applies', () => {
    expect(renderPath({ animated: true }).visible.style.strokeDasharray).toBe('');
    // animated wins even when a dashed strokeStyle is requested
    expect(
      renderPath({ animated: true, strokeStyle: 'dashed' }).visible.style.strokeDasharray
    ).toBe('');
  });

  it('uses 2px stroke by default, 3px when selected, and style.strokeWidth when provided', () => {
    expect(renderPath().visible.getAttribute('stroke-width')).toBe('2');
    expect(renderPath({ selected: true }).visible.getAttribute('stroke-width')).toBe('3');
    expect(
      renderPath({ selected: true, style: { strokeWidth: 5 } }).visible.getAttribute('stroke-width')
    ).toBe('5');
  });

  it('renders the selection outline layer only when selected', () => {
    expect(renderPath().outline).toBeNull();
    const { outline } = renderPath({ selected: true });
    expect(outline).not.toBeNull();
    expect(outline?.getAttribute('stroke')).toBe('var(--canvas-primary)');
  });

  it('applies opacity to the visible path and keeps the 20px interaction layer', () => {
    const { visible, interaction } = renderPath({ opacity: 0.5 });
    expect(visible.style.opacity).toBe('0.5');
    expect(interaction.getAttribute('stroke-width')).toBe('20');
    expect(interaction.getAttribute('stroke')).toBe('transparent');
  });

  it('uses a default cursor in readonly mode and pointer otherwise', () => {
    expect(renderPath().interaction.style.cursor).toBe('pointer');
    expect(renderPath({ isReadOnly: true }).interaction.style.cursor).toBe('default');
  });
});
