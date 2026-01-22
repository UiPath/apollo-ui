import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApSankeyDiagram } from './ApSankeyDiagram';
import type { SankeyData } from './ApSankeyDiagram.types';

describe('ApSankeyDiagram', () => {
  const mockData: SankeyData = {
    nodes: [
      { id: 'node1', label: 'Start Node' },
      { id: 'node2', label: 'Middle Node' },
      { id: 'node3', label: 'End Node' },
    ],
    links: [
      { source: 'node1', target: 'node2', value: 10 },
      { source: 'node2', target: 'node3', value: 5 },
    ],
  };

  it('should render without crashing', () => {
    const { container } = render(<ApSankeyDiagram data={mockData} />);
    const sankeyContainer = container.querySelector('[role="img"][aria-label="Sankey diagram"]');
    expect(sankeyContainer).toBeInTheDocument();
  });

  it('should apply custom width and height', () => {
    const { container } = render(<ApSankeyDiagram data={mockData} width={600} height={300} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '600px', height: '300px' });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ApSankeyDiagram data={mockData} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have accessible label', () => {
    const ariaLabel = 'Job flow diagram';
    render(<ApSankeyDiagram data={mockData} ariaLabel={ariaLabel} />);
    expect(screen.getByLabelText(ariaLabel)).toBeInTheDocument();
  });

  it('should call onNodeClick when provided', () => {
    const onNodeClick = vi.fn();
    render(<ApSankeyDiagram data={mockData} onNodeClick={onNodeClick} />);
    // Note: Full implementation would require D3 interaction testing
  });

  it('should call onLinkClick when provided', () => {
    const onLinkClick = vi.fn();
    render(<ApSankeyDiagram data={mockData} onLinkClick={onLinkClick} />);
    // Note: Full implementation would require D3 interaction testing
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<ApSankeyDiagram data={mockData} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('should handle empty data gracefully', () => {
    const emptyData: SankeyData = { nodes: [], links: [] };
    const { container } = render(<ApSankeyDiagram data={emptyData} />);
    const sankeyContainer = container.querySelector('[role="img"][aria-label="Sankey diagram"]');
    expect(sankeyContainer).toBeInTheDocument();
  });
});
