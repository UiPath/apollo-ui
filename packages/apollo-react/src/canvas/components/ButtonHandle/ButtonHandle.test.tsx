import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import type { ButtonHandleConfig, HandleMouseEvent } from './ButtonHandle';
import { ButtonHandle, ButtonHandles, getHandleHitRegionClipPath } from './ButtonHandle';

// Mock @xyflow/react Handle component
vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  Handle: ({ children, isConnectable, isConnectableStart, isConnectableEnd, ...props }: any) => {
    // Filter out styled-component props that shouldn't be passed to DOM elements
    const domProps = Object.keys(props).reduce((acc: any, key) => {
      if (!key.startsWith('$')) {
        acc[key] = props[key];
      }
      return acc;
    }, {});

    return (
      <div
        data-testid="handle"
        data-is-connectable={isConnectable}
        data-is-connectable-start={isConnectableStart}
        data-is-connectable-end={isConnectableEnd}
        {...domProps}
      >
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
    expect(handle).not.toHaveClass('pointer-events-auto!');

    rerender(
      <ButtonHandles
        handles={handles}
        nodeId="test-node"
        position={Position.Right}
        visible={false}
      />
    );

    expect(handle).toHaveClass('pointer-events-none!', 'opacity-0');
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

  describe('hover bridge', () => {
    const renderGroup = (showButton?: boolean) =>
      render(
        <ButtonHandles
          handles={[
            { id: 'out', type: 'source', handleType: 'output', onAction: vi.fn(), showButton },
          ]}
          nodeId="n"
          position={Position.Bottom}
          selected
        />
      );
    const bridge = (container: HTMLElement) =>
      container.querySelector('.pointer-events-auto.cursor-default');

    it('bridges the gap to a source handle that can show an add button', () => {
      const { container } = renderGroup();

      expect(bridge(container)).toBeInTheDocument();
    });

    it('adds no bridge for a source handle with showButton false', () => {
      const { container } = renderGroup(false);

      expect(bridge(container)).not.toBeInTheDocument();
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

    // Prefix match: this PR gives the add button a more specific accessible
    // name ("Add node from {label} handle") instead of the bare "Add node",
    // so an exact-match selector would stop finding it.
    const queryAddButton = () => document.querySelector('[aria-label^="Add node"]');

    it('reserves the add button slot while the node is unlocked', () => {
      render(<ButtonHandles handles={[hoverHandle]} nodeId="n" position={Position.Top} />);
      expect(queryAddButton()).toBeDisabled();
    });

    it('drops the add button slot when the node is locked', () => {
      render(<ButtonHandles handles={[hoverHandle]} nodeId="n" position={Position.Top} isLocked />);
      expect(queryAddButton()).toBeNull();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    it('drops the add button slot when the handle opts out of a button', () => {
      render(
        <ButtonHandles
          handles={[{ ...hoverHandle, showButton: false }]}
          nodeId="n"
          position={Position.Top}
        />
      );
      expect(queryAddButton()).toBeNull();
    });

    it('names the add button after its label on inward handles too, without a duplicate visual label', () => {
      // Inward handles (connectionPosition !== position) render their own visual
      // label via InwardHandleContent — HandleButton must still pick up the same
      // text for its accessible name (via label + renderLabel={false}) without
      // rendering a second, duplicate "Tools" label of its own.
      render(
        <ButtonHandles
          handles={[hoverHandle]}
          nodeId="n"
          position={Position.Top}
          connectionPosition={Position.Bottom}
          hovered
        />
      );

      expect(
        screen.getByRole('button', { name: 'Add node from Tools handle' })
      ).toBeInTheDocument();
      expect(screen.getAllByText('Tools')).toHaveLength(1);
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

describe('ButtonHandle opt-in interaction options', () => {
  const renderHandle = (props: Partial<React.ComponentProps<typeof ButtonHandle>> = {}) =>
    render(
      <ButtonHandle
        id="handle1"
        nodeId="test-node"
        type="source"
        handleType="output"
        position={Position.Right}
        onAction={vi.fn()}
        {...props}
      />
    );
  const notch = () => screen.getByTestId('handle').querySelector('.border-2');

  it('keeps the whole handle grabbable and the button full size by default', () => {
    renderHandle();

    expect(screen.getByTestId('handle')).not.toHaveClass('pointer-events-none!');
    expect(screen.getByRole('button')).not.toHaveClass('h-4');
    expect(notch()).toHaveClass('opacity-100');
  });

  it('limits the grab zone to the half outside the node for hitArea="outer"', () => {
    renderHandle({ hitArea: 'outer' });

    const handle = screen.getByTestId('handle');
    expect(handle).toHaveClass('pointer-events-none!');
    expect(handle.querySelector('span.pointer-events-auto')).toHaveClass('right-0', 'w-1/2');
  });

  it('drops the outer grab zone while the handle is hidden', () => {
    renderHandle({ hitArea: 'outer', visible: false });

    expect(screen.getByTestId('handle').querySelector('span.pointer-events-auto')).toBeNull();
  });

  describe('buttonReveal="expand-on-hover"', () => {
    it('shows a small button in place of the notch until the handle is hovered', async () => {
      const user = userEvent.setup();
      renderHandle({ buttonReveal: 'expand-on-hover' });

      expect(screen.getByRole('button')).toHaveClass('h-4', 'w-4');
      expect(notch()).toHaveClass('opacity-0');

      await user.hover(screen.getByRole('button'));
      expect(screen.getByRole('button')).not.toHaveClass('h-4');

      await user.unhover(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveClass('h-4');
    });

    it('stays expanded through mouse down so a click still lands on the button', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderHandle({ buttonReveal: 'expand-on-hover', onAction });

      await user.pointer([
        { target: screen.getByRole('button') },
        { keys: '[MouseLeft>]', target: screen.getByRole('button') },
      ]);
      expect(screen.getByRole('button')).not.toHaveClass('h-4');

      await user.pointer({ keys: '[/MouseLeft]' });
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('expands every button of a selected node', () => {
      renderHandle({ buttonReveal: 'expand-on-hover', selected: true });

      expect(screen.getByRole('button')).not.toHaveClass('h-4');
    });

    it('shows the notch when the button is not, as when connecting', () => {
      renderHandle({ buttonReveal: 'expand-on-hover', showButton: false });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(notch()).toHaveClass('opacity-100');
    });

    it('hides the notch along with a hidden handle so it cannot flash on reveal', () => {
      renderHandle({ buttonReveal: 'expand-on-hover', showButton: false, visible: false });

      expect(notch()).toHaveClass('opacity-0');
    });

    it('renders a circular button for buttonShape="circle"', () => {
      renderHandle({ buttonReveal: 'expand-on-hover', buttonShape: 'circle' });

      expect(screen.getByRole('button')).toHaveClass('rounded-full');
    });
  });
});

describe('ButtonHandle host options', () => {
  const renderHandle = (props: Partial<React.ComponentProps<typeof ButtonHandle>> = {}) =>
    render(
      <ButtonHandle
        id="handle1"
        nodeId="test-node"
        type="source"
        handleType="output"
        position={Position.Right}
        onAction={vi.fn()}
        {...props}
      />
    );
  const handle = () => screen.getByTestId('handle');
  const visuals = () => document.querySelector('[data-handle-visuals]') as HTMLElement;

  it('straddles the node edge with its visuals inside the handle by default', () => {
    renderHandle();

    expect(handle()).toHaveStyle({ width: '24px', height: '50%', right: '0px' });
    expect(handle().style.clipPath).toBe('');
    expect(handle()).toContainElement(screen.getByRole('button'));
    expect(handle().querySelector('.border-2')).not.toBeNull();
    expect(visuals()).toBeNull();
  });

  it('puts addButtonTestId on the add button', () => {
    renderHandle({ addButtonTestId: 'add-right' });

    expect(screen.getByTestId('add-right')).toBe(screen.getByRole('button'));
  });

  describe('anchor="node"', () => {
    it('fills the node so edges anchor on its border', () => {
      renderHandle({ anchor: 'node' });

      expect(handle()).toHaveStyle({
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
        width: '100%',
        height: '100%',
        transform: 'none',
      });
    });

    it('renders the notch, button and label outside the handle element', () => {
      renderHandle({ anchor: 'node', label: 'Next' });

      expect(handle()).toBeEmptyDOMElement();
      expect(visuals()).toContainElement(screen.getByRole('button'));
      expect(visuals().querySelector('.border-2')).not.toBeNull();
      expect(visuals()).toHaveTextContent('Next');
      // Where an edge-anchored handle sits, so the visuals keep their place.
      expect(visuals()).toHaveStyle({ width: '24px', height: '50%', right: '0px' });
    });

    it('renders a label without a button outside the handle too', () => {
      renderHandle({ anchor: 'node', type: 'target', onAction: undefined, label: 'In' });

      expect(handle()).toBeEmptyDOMElement();
      expect(visuals()).toHaveTextContent('In');
    });

    it.each([
      [Position.Top, 'inset(0 0 calc(100% - 8px) 0)'],
      [Position.Right, 'inset(0 0 0 calc(100% - 8px))'],
      [Position.Bottom, 'inset(calc(100% - 8px) 0 0 0)'],
      [Position.Left, 'inset(0 calc(100% - 8px) 0 0)'],
    ])('clips the %s handle to a strip along its side by default', (position, clipPath) => {
      expect(getHandleHitRegionClipPath(position)).toBe(clipPath);
      renderHandle({ anchor: 'node', position });
      expect(handle().style.clipPath).toBe(clipPath);
    });

    it('sizes the strip from hitRegionDepth', () => {
      renderHandle({ anchor: 'node', hitRegionDepth: 14 });

      expect(handle().style.clipPath).toBe('inset(0 0 0 calc(100% - 14px))');
    });

    it.each([
      [Position.Top, 'polygon(50% 50%, 0% 0%, 100% 0%)'],
      [Position.Right, 'polygon(50% 50%, 100% 0%, 100% 100%)'],
      [Position.Bottom, 'polygon(50% 50%, 100% 100%, 0% 100%)'],
      [Position.Left, 'polygon(50% 50%, 0% 100%, 0% 0%)'],
    ])('clips the %s handle to its quarter of the node for hitRegion="quadrant"', (position, clipPath) => {
      expect(getHandleHitRegionClipPath(position, 'quadrant')).toBe(clipPath);
      renderHandle({ anchor: 'node', position, hitRegion: 'quadrant' });
      expect(handle().style.clipPath).toBe(clipPath);
    });

    describe('notch grab zone', () => {
      const grabZone = () => document.querySelector('[data-handle-grab-zone]') as HTMLElement;

      it('marks the shown notch as part of the handle so xyflow connects from it', () => {
        renderHandle({ anchor: 'node', position: Position.Left });

        expect(grabZone()).toHaveClass('source', 'nodrag', 'nopan', 'pointer-events-auto');
        expect(grabZone()).toHaveAttribute('data-handleid', 'handle1');
        expect(grabZone()).toHaveAttribute('data-handlepos', 'left');
        expect(grabZone().querySelector('.border-2')).not.toBeNull();
      });

      it('takes the type of a target handle', () => {
        renderHandle({ anchor: 'node', type: 'target', onAction: undefined });

        expect(grabZone()).toHaveClass('target');
        expect(grabZone()).not.toHaveClass('source');
      });

      it("passes a press and hover on to the handle's and the host's handlers", async () => {
        const user = userEvent.setup();
        const handlers = {
          onPointerDown: vi.fn(),
          onMouseDown: vi.fn(),
          onMouseEnter: vi.fn(),
          onMouseLeave: vi.fn(),
        };
        renderHandle({ anchor: 'node', handleProps: handlers });
        const notch = () => grabZone().querySelector('.border-2');

        await user.hover(grabZone());
        expect(handlers.onMouseEnter).toHaveBeenCalledTimes(1);
        expect(notch()).toHaveClass('bg-brand');

        fireEvent.pointerDown(grabZone());
        fireEvent.mouseDown(grabZone());
        expect(handlers.onPointerDown).toHaveBeenCalledTimes(1);
        expect(handlers.onMouseDown).toHaveBeenCalledTimes(1);

        await user.unhover(grabZone());
        expect(handlers.onMouseLeave).toHaveBeenCalledTimes(1);
        expect(notch()).not.toHaveClass('bg-brand');
      });

      it('anchors on the node even when a different connection side is given', () => {
        renderHandle({ anchor: 'node', position: Position.Left, connectionPosition: Position.Top });

        expect(grabZone()).toHaveAttribute('data-handlepos', 'left');
      });

      it('fills the notch while highlighted, as hover does', () => {
        const { unmount } = renderHandle({ anchor: 'node' });
        expect(grabZone().querySelector('.border-2')).not.toHaveClass('bg-brand');
        unmount();

        renderHandle({ anchor: 'node', highlighted: true });
        expect(grabZone().querySelector('.border-2')).toHaveClass('bg-brand');
      });

      it('is inert while the notch or the handle is hidden', () => {
        const { unmount } = renderHandle({ anchor: 'node', showNotches: false });
        expect(grabZone()).toBeNull();
        unmount();

        renderHandle({ anchor: 'node', visible: false });
        expect(grabZone()).toBeNull();
      });

      it('is inert while the "+" stands in for the notch', () => {
        renderHandle({ anchor: 'node', buttonReveal: 'expand-on-hover' });

        expect(grabZone()).toBeNull();
      });

      it('keeps a press on the "+" away from the host handlers', () => {
        const onPointerDown = vi.fn();
        const onMouseDown = vi.fn();
        renderHandle({ anchor: 'node', handleProps: { onPointerDown, onMouseDown } });

        fireEvent.pointerDown(screen.getByRole('button'));
        fireEvent.mouseDown(screen.getByRole('button'));
        expect(onPointerDown).not.toHaveBeenCalled();
        expect(onMouseDown).not.toHaveBeenCalled();
      });

      it('does not exist on an edge-anchored handle', () => {
        renderHandle();

        expect(grabZone()).toBeNull();
        expect(document.querySelector('[data-handleid]')).toBeNull();
        expect(handle().querySelector('.source')).toBeNull();
      });
    });

    it('keeps a hidden handle in the DOM but inert', () => {
      renderHandle({ anchor: 'node', visible: false, showButton: false });

      expect(handle()).toHaveClass('pointer-events-none!');
      expect(visuals()).toHaveClass('opacity-0', 'pointer-events-none');
    });

    it('expands the button on hover of the handle or the button, and when selected', async () => {
      const user = userEvent.setup();
      const { rerender } = renderHandle({ anchor: 'node', buttonReveal: 'expand-on-hover' });
      const notch = () => visuals().querySelector('.border-2');

      expect(screen.getByRole('button')).toHaveClass('h-4', 'w-4');
      expect(notch()).toHaveClass('opacity-0');

      await user.hover(handle());
      expect(screen.getByRole('button')).not.toHaveClass('h-4');

      await user.hover(screen.getByRole('button'));
      expect(screen.getByRole('button')).not.toHaveClass('h-4');

      await user.unhover(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveClass('h-4');

      rerender(
        <ButtonHandle
          id="handle1"
          nodeId="test-node"
          type="source"
          handleType="output"
          position={Position.Right}
          onAction={vi.fn()}
          anchor="node"
          buttonReveal="expand-on-hover"
          buttonShape="circle"
          selected
        />
      );
      expect(screen.getByRole('button')).not.toHaveClass('h-4');
      expect(screen.getByRole('button')).toHaveClass('rounded-full');
    });

    it('shows the notch in place of a hidden button, and no notch for showNotches={false}', () => {
      const { unmount } = renderHandle({
        anchor: 'node',
        buttonReveal: 'expand-on-hover',
        showButton: false,
      });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(visuals().querySelector('.border-2')).toHaveClass('opacity-100');
      unmount();

      renderHandle({ anchor: 'node', showNotches: false });
      expect(visuals().querySelector('.border-2')).toHaveClass('opacity-0');
    });

    it('still fires onAction from the button', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderHandle({ anchor: 'node', onAction });

      await user.click(screen.getByRole('button'));
      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({ handleId: 'handle1', nodeId: 'test-node' })
      );
    });
  });

  describe.each(['edge', 'node'] as const)('handleProps with anchor="%s"', (anchor) => {
    it('forwards connectability, attributes, class and style to the handle', () => {
      const onPointerDown = vi.fn();
      renderHandle({
        anchor,
        handleProps: {
          isConnectable: false,
          isConnectableStart: false,
          isConnectableEnd: true,
          onPointerDown,
          className: 'host-class',
          style: { zIndex: 7, width: '10px' },
          'data-role': 'target',
        },
      });

      expect(handle()).toHaveAttribute('data-is-connectable', 'false');
      expect(handle()).toHaveAttribute('data-is-connectable-start', 'false');
      expect(handle()).toHaveAttribute('data-is-connectable-end', 'true');
      expect(handle()).toHaveAttribute('data-role', 'target');
      expect(handle()).toHaveClass('host-class', 'border-0!');
      // Host style wins over apollo's.
      expect(handle()).toHaveStyle({ zIndex: '7', width: '10px' });

      fireEvent.pointerDown(handle());
      expect(onPointerDown).toHaveBeenCalledTimes(1);
    });

    it("runs the host's mouse handlers alongside apollo's own", async () => {
      const user = userEvent.setup();
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();
      const onMouseDown = vi.fn();
      renderHandle({
        anchor,
        buttonReveal: 'expand-on-hover',
        handleProps: { onMouseEnter, onMouseLeave, onMouseDown },
      });

      await user.hover(handle());
      expect(onMouseEnter).toHaveBeenCalledTimes(1);
      // Apollo's own hover tracking still expands the button.
      expect(screen.getByRole('button')).not.toHaveClass('h-4');

      fireEvent.mouseDown(handle());
      expect(onMouseDown).toHaveBeenCalledTimes(1);

      await user.unhover(handle());
      expect(onMouseLeave).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button')).toHaveClass('h-4');
    });

    it('hands the handle element to elementRef, as an object or a callback', () => {
      const objectRef = { current: null as HTMLDivElement | null };
      const { unmount } = renderHandle({ anchor, elementRef: objectRef });
      expect(objectRef.current).toBe(handle());
      unmount();
      expect(objectRef.current).toBeNull();

      const callbackRef = vi.fn();
      renderHandle({ anchor, elementRef: callbackRef });
      expect(callbackRef).toHaveBeenCalledWith(handle());
    });
  });

  it('forwards handleProps and elementRef to an inward handle as well', () => {
    const elementRef = { current: null as HTMLDivElement | null };
    renderHandle({
      connectionPosition: Position.Left,
      elementRef,
      handleProps: { className: 'host-class', 'data-role': 'loop' },
    });

    expect(handle()).toHaveClass('host-class');
    expect(handle()).toHaveAttribute('data-role', 'loop');
    expect(elementRef.current).toBe(handle());
  });
});
