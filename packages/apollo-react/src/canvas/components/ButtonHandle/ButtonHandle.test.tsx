import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import type { ButtonHandleConfig, HandleMouseEvent } from './ButtonHandle';
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

    // The add button is an apollo-wind Button rendered inside HandleAddButton
    const addButton = screen.getByRole('button');
    await user.click(addButton);

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
    expect(handle).toHaveClass('opacity-100');

    rerender(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Right}
        visible={false}
      />
    );

    expect(handle).toHaveClass('opacity-0');
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

    // The artifact handle is connectable the edge should render
    expect(screen.getByTestId('handle')).toBeInTheDocument();
  });

  it('renders handle without color prop', () => {
    const handles: ButtonHandleConfig[] = [
      {
        id: 'handle1',
        type: 'source',
        handleType: 'output',
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

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

  describe('hover-gated labels (labelVisibility)', () => {
    const hoverHandle: ButtonHandleConfig = {
      id: 'tool',
      type: 'source',
      handleType: 'artifact',
      label: 'Tools',
      showButton: true,
      labelVisibility: 'hover',
      onAction: vi.fn(),
    };

    const getLabelClass = () =>
      screen.getByText('Tools').closest('[class*="transition-opacity"]')?.className ?? '';

    it('hides the label when the node is neither hovered nor selected', () => {
      render(<ButtonHandles handles={[hoverHandle]} nodeId="n" position={Position.Top} />);
      expect(getLabelClass()).toContain('opacity-0');
    });

    it('reveals the label when the node is hovered', () => {
      render(<ButtonHandles handles={[hoverHandle]} nodeId="n" position={Position.Top} hovered />);
      expect(getLabelClass()).toContain('opacity-100');
    });

    it('reveals the label when the node is selected', () => {
      render(<ButtonHandles handles={[hoverHandle]} nodeId="n" position={Position.Top} selected />);
      expect(getLabelClass()).toContain('opacity-100');
    });

    it('hover-gates the inward label when connectionPosition differs from position', () => {
      const { rerender } = render(
        <ButtonHandles
          handles={[hoverHandle]}
          nodeId="n"
          position={Position.Top}
          connectionPosition={Position.Bottom}
        />
      );
      expect(getLabelClass()).toContain('opacity-0');

      rerender(
        <ButtonHandles
          handles={[hoverHandle]}
          nodeId="n"
          position={Position.Top}
          connectionPosition={Position.Bottom}
          hovered
        />
      );
      expect(getLabelClass()).toContain('opacity-100');
    });

    it('keeps a default (always) label visible regardless of hover/selection', () => {
      const alwaysHandle: ButtonHandleConfig = {
        id: 'tool',
        type: 'source',
        handleType: 'artifact',
        label: 'Tools',
        showButton: true,
        onAction: vi.fn(),
      };
      render(<ButtonHandles handles={[alwaysHandle]} nodeId="n" position={Position.Top} />);
      expect(getLabelClass()).toContain('opacity-100');
    });
  });

  describe('Grid-aligned positioning', () => {
    it('uses grid-aligned positioning for Top handles when nodeWidth is provided', () => {
      const handles: ButtonHandleConfig[] = [
        { id: 'handle1', type: 'source', handleType: 'output' },
        { id: 'handle2', type: 'source', handleType: 'output' },
      ];

      // With nodeWidth=96, gridSize=16: ideal=32, rounded=32, span=32, start=32.
      // Positions: [32, 64] → 33.333...%, 66.666...%
      render(
        <ButtonHandles
          handles={handles}
          nodeId="test-node"
          position={Position.Top}
          nodeWidth={96}
        />
      );

      const handleElements = screen.getAllByTestId('handle');
      expect(handleElements).toHaveLength(2);

      expect(handleElements[0]).toHaveStyle({ left: '33.33333333333333%' });
      expect(handleElements[1]).toHaveStyle({ left: '66.66666666666666%' });
    });

    it('uses grid-aligned positioning for Left handles when nodeHeight is provided', () => {
      const handles: ButtonHandleConfig[] = [
        { id: 'handle1', type: 'target', handleType: 'input' },
        { id: 'handle2', type: 'target', handleType: 'input' },
      ];

      // Same logic as Top handles but uses nodeHeight for vertical positioning
      render(
        <ButtonHandles
          handles={handles}
          nodeId="test-node"
          position={Position.Left}
          nodeHeight={96}
        />
      );

      const handleElements = screen.getAllByTestId('handle');
      expect(handleElements).toHaveLength(2);

      expect(handleElements[0]).toHaveStyle({ top: '33.33333333333333%' });
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

      // nodeHeight=80 → exact center (40) is half a grid step off (gridSize=16).
      // Snap rounds to 48 (60%) so the handle stays grid-aligned.
      expect(handleElements[0]).toHaveStyle({ top: '60%' });
    });
  });

  describe('Hover handlers', () => {
    it('invokes onMouseEnter with the HandleMouseEvent payload and emits handle:mouseenter on the bus', async () => {
      const user = userEvent.setup();
      const onMouseEnter = vi.fn();
      const busSpy = vi.fn();

      const unsubscribe = canvasEventBus.on('handle:mouseenter', busSpy);

      const handles: ButtonHandleConfig[] = [
        {
          id: 'handle1',
          type: 'source',
          handleType: 'output',
          showButton: true,
          onAction: vi.fn(),
          onMouseEnter,
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

      const button = screen.getByRole('button');
      await user.hover(button);

      const expectedPayload: HandleMouseEvent = {
        handleId: 'handle1',
        nodeId: 'test-node',
        handleType: 'output',
        position: Position.Right,
      };
      expect(onMouseEnter).toHaveBeenCalledWith(expectedPayload);
      expect(busSpy).toHaveBeenCalledWith(expect.objectContaining(expectedPayload));

      unsubscribe();
    });

    it('invokes onMouseLeave with the HandleMouseEvent payload and emits handle:mouseleave on the bus', async () => {
      const user = userEvent.setup();
      const onMouseLeave = vi.fn();
      const busSpy = vi.fn();

      const unsubscribe = canvasEventBus.on('handle:mouseleave', busSpy);

      const handles: ButtonHandleConfig[] = [
        {
          id: 'handle1',
          type: 'source',
          handleType: 'output',
          showButton: true,
          onAction: vi.fn(),
          onMouseLeave,
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

      const button = screen.getByRole('button');
      await user.hover(button);
      await user.unhover(button);

      const expectedPayload: HandleMouseEvent = {
        handleId: 'handle1',
        nodeId: 'test-node',
        handleType: 'output',
        position: Position.Right,
      };
      expect(onMouseLeave).toHaveBeenCalledWith(expectedPayload);
      expect(busSpy).toHaveBeenCalledWith(expect.objectContaining(expectedPayload));

      unsubscribe();
    });

    it('emits bus events even when no onMouseEnter/onMouseLeave callbacks are wired', async () => {
      const user = userEvent.setup();
      const enterSpy = vi.fn();
      const leaveSpy = vi.fn();

      const unsubscribeEnter = canvasEventBus.on('handle:mouseenter', enterSpy);
      const unsubscribeLeave = canvasEventBus.on('handle:mouseleave', leaveSpy);

      const handles: ButtonHandleConfig[] = [
        {
          id: 'handle1',
          type: 'source',
          handleType: 'output',
          showButton: true,
          onAction: vi.fn(),
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

      const button = screen.getByRole('button');
      await user.hover(button);
      await user.unhover(button);

      const expectedPayload = {
        handleId: 'handle1',
        nodeId: 'test-node',
        handleType: 'output',
        position: Position.Right,
      };
      expect(enterSpy).toHaveBeenCalledWith(expect.objectContaining(expectedPayload));
      expect(leaveSpy).toHaveBeenCalledWith(expect.objectContaining(expectedPayload));

      unsubscribeEnter();
      unsubscribeLeave();
    });
  });
});

describe('marker variant handles', () => {
  it('renders a circular icon badge instead of the notch', () => {
    const defaultHandle: ButtonHandleConfig[] = [
      { id: 'plain', type: 'target', handleType: 'input' },
    ];
    const { container: defaultContainer } = render(
      <ButtonHandles
        handles={defaultHandle}
        nodeId="test-node"
        position={Position.Top}
        visible={true}
      />
    );
    // Control: a default handle renders the border-2 notch element.
    expect(defaultContainer.querySelector('.border-2')).not.toBeNull();

    const markerHandle: ButtonHandleConfig[] = [
      {
        id: 'eventTrigger',
        type: 'target',
        handleType: 'input',
        variant: 'marker',
        icon: 'zap',
      },
    ];
    const { container } = render(
      <ButtonHandles
        handles={markerHandle}
        nodeId="test-node"
        position={Position.Top}
        visible={true}
      />
    );

    expect(screen.getByTestId('marker-handle-eventTrigger')).toBeInTheDocument();
    // The notch is replaced by the badge for marker handles.
    expect(container.querySelector('.border-2')).toBeNull();
  });

  it('shows the marker label but never an inline add button', () => {
    const handles: ButtonHandleConfig[] = [
      {
        id: 'eventTrigger',
        type: 'target',
        handleType: 'input',
        variant: 'marker',
        icon: 'zap',
        label: 'Fraud signal',
        onAction: vi.fn(),
      },
    ];

    render(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Top}
        selected={true}
        visible={true}
      />
    );

    expect(screen.getByText('Fraud signal')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
