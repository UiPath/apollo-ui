import { render } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { HandleButton, HandleHoverBridge } from './HandleButton';

const bridge = (container: HTMLElement) => container.firstElementChild as HTMLElement | null;

describe('HandleHoverBridge', () => {
  it('renders nothing unless visible', () => {
    const { container } = render(<HandleHoverBridge position={Position.Top} />);

    expect(bridge(container)).toBeNull();
  });

  it('reaches 60px out by default', () => {
    const { container } = render(<HandleHoverBridge position={Position.Top} visible />);

    expect(bridge(container)).toHaveClass('h-15');
    expect(bridge(container)?.style.height).toBe('');
  });

  it('reaches a custom extent along the side it bridges', () => {
    const top = render(<HandleHoverBridge position={Position.Top} visible extent={28} />);
    expect(bridge(top.container)).not.toHaveClass('h-15');
    expect(bridge(top.container)?.style.height).toBe('28px');

    const right = render(<HandleHoverBridge position={Position.Right} visible extent={28} />);
    expect(bridge(right.container)?.style.width).toBe('28px');
  });
});

describe('HandleButton as the handle', () => {
  const stack = (container: HTMLElement) => container.firstElementChild as HTMLElement;
  const renderButton = (props: Partial<React.ComponentProps<typeof HandleButton>> = {}) =>
    render(<HandleButton visible position={Position.Right} onAction={vi.fn()} compact {...props} />)
      .container;

  it('sits beyond the handle with no anchor offset by default', () => {
    expect(stack(renderButton({ compact: undefined })).style.marginLeft).toBe('');
  });

  it('centres a small circle on the node edge from a 12px handle', () => {
    expect(stack(renderButton({ shape: 'circle' })).style.marginLeft).toBe('-20px');
  });

  it('pulls a small rounded button in by less than a circle', () => {
    expect(stack(renderButton({ shape: 'rounded' })).style.marginLeft).toBe('-10px');
  });
});
