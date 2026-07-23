import { render } from '@testing-library/react';
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

  it('uses the primary border when selected and the default border otherwise', () => {
    expect(renderLabel().label.className).toContain('border-(--canvas-border)');
    expect(renderLabel({ selected: true }).label.className).toContain('border-(--canvas-primary)');
  });

  it('falls back to --color-background when --canvas-background is unresolved', () => {
    expect(renderLabel().label.className).toContain(
      'bg-[var(--canvas-background,var(--color-background))]'
    );
  });
});
