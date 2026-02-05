import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { ButtonHandleConfig } from './ButtonHandle';
import { ButtonHandles } from './ButtonHandle';

// Mock @xyflow/react Handle component
vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  Handle: ({ children, isConnectable, ...props }: any) => {
    // Filter out styled-component props that shouldn't be passed to DOM elements
    const domProps = Object.keys(props).reduce((acc: any, key) => {
      if (!key.startsWith('$')) {
        acc[key] = props[key];
      }
      return acc;
    }, {});

    return (
      <div data-testid="handle" data-is-connectable={isConnectable} {...domProps}>
        {children}
      </div>
    );
  },
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
}));

describe('ButtonHandles', () => {
  it('renders multiple handles', () => {
    const handles: ButtonHandleConfig[] = [
      { id: 'handle1', type: 'source', handleType: 'output' },
      { id: 'handle2', type: 'target', handleType: 'input' },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    const handleElements = screen.getAllByTestId('handle');
    expect(handleElements).toHaveLength(2);
  });

  it('renders handle with label', () => {
    const handles: ButtonHandleConfig[] = [
      { id: 'handle1', type: 'source', handleType: 'output', label: 'Output Handle' },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    expect(screen.getByText('Output Handle')).toBeInTheDocument();
  });

  it('renders handle with label icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    const handles: ButtonHandleConfig[] = [
      {
        id: 'handle1',
        type: 'source',
        handleType: 'output',
        label: 'With Icon',
        labelIcon: <TestIcon />,
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const handles: ButtonHandleConfig[] = [
      {
        id: 'handle1',
        type: 'source',
        handleType: 'output',
        showButton: true,
        onAction: handleClick,
      },
    ];

    render(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Right}
        selected={true}
        visible={true}
      />
    );

    // Find the handle element first
    const handle = screen.getByTestId('handle');

    // The button is rendered within the handle, look for the clickable element
    // The AddButton component uses a motion div that contains the icon
    const buttonContainer = handle.querySelector('.nodrag.nopan');

    if (!buttonContainer) {
      throw new Error('Button container not found');
    }

    // Click on the button container's child (the animated button)
    const animatedButton = buttonContainer.firstElementChild;
    if (!animatedButton) {
      throw new Error('Animated button not found');
    }

    await user.click(animatedButton);

    expect(handleClick).toHaveBeenCalledOnce();
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        handleId: 'handle1',
        nodeId: 'test-node',
      })
    );
  });

  it('does not render button when showButton is false', () => {
    const handleClick = vi.fn();
    const handles: ButtonHandleConfig[] = [
      {
        id: 'handle1',
        type: 'source',
        handleType: 'output',
        showButton: false,
        onAction: handleClick,
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    const buttons = screen.queryAllByTestId('ap-icon');
    expect(buttons).toHaveLength(0);
  });

  it('applies selected styles', () => {
    const handles: ButtonHandleConfig[] = [{ id: 'handle1', type: 'source', handleType: 'output' }];

    const { rerender } = render(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Right}
        selected={false}
      />
    );

    // Check that it renders without selected state
    expect(screen.getByTestId('handle')).toBeInTheDocument();

    // Re-render with selected state
    rerender(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Right}
        selected={true}
      />
    );

    // Should still render
    expect(screen.getByTestId('handle')).toBeInTheDocument();
  });

  it('handles visibility prop', () => {
    const handles: ButtonHandleConfig[] = [{ id: 'handle1', type: 'source', handleType: 'output' }];

    const { rerender } = render(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Right}
        visible={true}
      />
    );

    const handle = screen.getByTestId('handle');
    expect(handle).toBeInTheDocument();

    rerender(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Right}
        visible={false}
      />
    );

    expect(screen.queryByTestId('handle')).not.toBeInTheDocument();
  });

  it('positions handles correctly for different positions', () => {
    const handles: ButtonHandleConfig[] = [
      { id: 'handle1', type: 'source', handleType: 'output' },
      { id: 'handle2', type: 'source', handleType: 'output' },
    ];

    const { rerender } = render(
      <ButtonHandles handles={handles} nodeId="test-node" position={Position.Top} />
    );

    let handleElements = screen.getAllByTestId('handle');
    expect(handleElements[0]).toHaveStyle({ left: '33.33333333333333%' });
    expect(handleElements[1]).toHaveStyle({ left: '66.66666666666666%' });

    rerender(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    handleElements = screen.getAllByTestId('handle');
    expect(handleElements[0]).toHaveStyle({ top: '33.33333333333333%' });
    expect(handleElements[1]).toHaveStyle({ top: '66.66666666666666%' });
  });

  it('renders artifact handle type correctly', () => {
    const handles: ButtonHandleConfig[] = [
      { id: 'handle1', type: 'source', handleType: 'artifact' },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    const handle = screen.getByTestId('handle');
    expect(handle).toHaveAttribute('data-is-connectable', 'false');
  });

  it('applies custom color to handles', () => {
    const handles: ButtonHandleConfig[] = [
      {
        id: 'handle1',
        type: 'source',
        handleType: 'output',
        color: 'red',
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    // The color is applied to HandleNotch component
    expect(screen.getByTestId('handle')).toBeInTheDocument();
  });

  it('should not apply bottom positioning when handles are only at left and right', () => {
    const leftHandles: ButtonHandleConfig[] = [
      { id: 'left-handle', type: 'target', handleType: 'input' },
    ];
    const rightHandles: ButtonHandleConfig[] = [
      { id: 'right-handle', type: 'source', handleType: 'output' },
    ];

    render(
      <>
        <ButtonHandles handles={leftHandles} nodeId="test-node" position={Position.Left} />
        <ButtonHandles handles={rightHandles} nodeId="test-node" position={Position.Right} />
      </>
    );

    const handleElements = screen.getAllByTestId('handle');
    expect(handleElements).toHaveLength(2);

    // Verify no bottom positioning is applied - handles should use top positioning for left/right
    handleElements.forEach((el) => {
      expect(el).not.toHaveStyle({ bottom: '0' });
    });
  });

  it('should not apply top edge positioning when handles are only at bottom', () => {
    const bottomHandles: ButtonHandleConfig[] = [
      { id: 'bottom-handle-1', type: 'source', handleType: 'artifact' },
      { id: 'bottom-handle-2', type: 'source', handleType: 'artifact' },
    ];

    render(<ButtonHandles handles={bottomHandles} nodeId="test-node" position={Position.Bottom} />);

    const handleElements = screen.getAllByTestId('handle');
    expect(handleElements).toHaveLength(2);

    // Bottom handles should have bottom: 0, not top: 0
    handleElements.forEach((el) => {
      expect(el).toHaveStyle({ bottom: '0' });
      expect(el).not.toHaveStyle({ top: '0' });
    });
  });

  describe('Grid-aligned positioning', () => {
    it('uses grid-aligned positioning for Top handles when nodeWidth is provided', () => {
      const handles: ButtonHandleConfig[] = [
        { id: 'handle1', type: 'source', handleType: 'output' },
        { id: 'handle2', type: 'source', handleType: 'output' },
      ];

      // With nodeWidth=120, grid-aligned positions should be calculated
      // GRID_SPACING is 16, so:
      // Handle 1: ideal = 40px, floor(40/16)*16 = 32px → 32/120*100 = 26.67%
      // Handle 2: ideal = 80px, ceil(80/16)*16 = 80px → 80/120*100 = 66.67%
      render(
        <ButtonHandles
          handles={handles}
          nodeId="test-node"
          position={Position.Top}
          nodeWidth={120}
        />
      );

      const handleElements = screen.getAllByTestId('handle');
      expect(handleElements).toHaveLength(2);

      // Grid-aligned positions differ from percentage-based (33.33%, 66.66%)
      expect(handleElements[0]).toHaveStyle({ left: '26.666666666666668%' });
      expect(handleElements[1]).toHaveStyle({ left: '66.66666666666666%' });
    });

    it('uses grid-aligned positioning for Left handles when nodeHeight is provided', () => {
      const handles: ButtonHandleConfig[] = [
        { id: 'handle1', type: 'target', handleType: 'input' },
        { id: 'handle2', type: 'target', handleType: 'input' },
      ];

      // With nodeHeight=120, grid-aligned positions should be calculated
      // Same logic as Top handles but uses nodeHeight for vertical positioning
      render(
        <ButtonHandles
          handles={handles}
          nodeId="test-node"
          position={Position.Left}
          nodeHeight={120}
        />
      );

      const handleElements = screen.getAllByTestId('handle');
      expect(handleElements).toHaveLength(2);

      expect(handleElements[0]).toHaveStyle({ top: '26.666666666666668%' });
      expect(handleElements[1]).toHaveStyle({ top: '66.66666666666666%' });
    });

    it('falls back to percentage-based positioning when node dimensions are not provided', () => {
      const handles: ButtonHandleConfig[] = [
        { id: 'handle1', type: 'source', handleType: 'output' },
        { id: 'handle2', type: 'source', handleType: 'output' },
      ];

      // Without node dimensions, should use percentage-based positioning
      render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Top} />);

      const handleElements = screen.getAllByTestId('handle');

      // Percentage-based: (1/3)*100 = 33.33% and (2/3)*100 = 66.66%
      expect(handleElements[0]).toHaveStyle({ left: '33.33333333333333%' });
      expect(handleElements[1]).toHaveStyle({ left: '66.66666666666666%' });
    });

    it('uses nodeWidth for Top/Bottom positions, not nodeHeight', () => {
      const handles: ButtonHandleConfig[] = [
        { id: 'handle1', type: 'source', handleType: 'output' },
      ];

      // Provide both dimensions - Top position should use nodeWidth
      render(
        <ButtonHandles
          handles={handles}
          nodeId="test-node"
          position={Position.Top}
          nodeWidth={160}
          nodeHeight={80}
        />
      );

      const handleElements = screen.getAllByTestId('handle');
      expect(handleElements).toHaveLength(1);

      // Single handle with nodeWidth=160 should be centered at 80px = 50%
      expect(handleElements[0]).toHaveStyle({ left: '50%' });
    });

    it('uses nodeHeight for Left/Right positions, not nodeWidth', () => {
      const handles: ButtonHandleConfig[] = [
        { id: 'handle1', type: 'target', handleType: 'input' },
      ];

      // Provide both dimensions - Left position should use nodeHeight
      render(
        <ButtonHandles
          handles={handles}
          nodeId="test-node"
          position={Position.Left}
          nodeWidth={160}
          nodeHeight={80}
        />
      );

      const handleElements = screen.getAllByTestId('handle');
      expect(handleElements).toHaveLength(1);

      // Single handle with nodeHeight=80: ideal = 40px (center)
      // round(40/16)*16 = round(2.5)*16 = 3*16 = 48px → 48/80*100 = 60%
      expect(handleElements[0]).toHaveStyle({ top: '60%' });
    });
  });
});
