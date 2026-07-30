import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EdgeLabel } from './EdgeLabel';

// EdgeLabelRenderer portals into a DOM node xyflow only creates once a full
// <ReactFlow> instance has mounted, which this unit test doesn't set up.
// Render straight through so we can assert on the label markup itself.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => children,
}));

function renderLabel(props: Partial<React.ComponentProps<typeof EdgeLabel>> = {}) {
  const { container } = render(<EdgeLabel x={150} y={50} text="Run" {...props} />);
  return {
    label: container.querySelector('.react-flow__edge-label') as HTMLDivElement,
  };
}

describe('EdgeLabel', () => {
  it('renders the text centered on the given point, opted out of pan/drag', () => {
    const { label } = renderLabel();
    expect(label.textContent).toBe('Run');
    expect(label.className).toContain('nodrag');
    expect(label.className).toContain('nopan');
    expect(label.style.transform).toBe('translate(-50%, -50%) translate(150px, 50px)');
  });

  it('uses the supplied edge color for its border and defaults to the canvas border', () => {
    const defaultLabel = renderLabel().label;
    const coloredLabel = renderLabel({ borderColor: 'var(--canvas-success-icon)' }).label;

    expect(defaultLabel.style.borderColor).toBe('var(--canvas-border)');
    expect(coloredLabel.style.borderColor).toBe('var(--canvas-success-icon)');
  });

  it('falls back to --color-background when --canvas-background is unresolved', () => {
    expect(renderLabel().label.className).toContain(
      'bg-[var(--canvas-background,var(--color-background))]'
    );
  });

  it('truncates by width and forwards interaction to its owning edge', () => {
    const onClick = vi.fn();
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const { label } = renderLabel({ onClick, onMouseEnter, onMouseLeave });

    expect(label.className).toContain('max-w-48');
    expect(label.className).toContain('overflow-hidden');
    expect(label.className).toContain('text-ellipsis');
    expect(label.className).toContain('pointer-events-auto');

    fireEvent.mouseEnter(label);
    fireEvent.mouseLeave(label);
    fireEvent.click(label);

    expect(onMouseEnter).toHaveBeenCalledOnce();
    expect(onMouseLeave).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
