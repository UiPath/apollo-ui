import { render } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { BaseNodeData } from '../../BaseNode/BaseNode.types';
import { createFlowOrBarNodeType } from './FlowOrBarNode';

type Props = NodeProps<Node<BaseNodeData>>;

const propsAt = (x: number): Props =>
  ({
    id: 'n1',
    type: 'step',
    data: STABLE_DATA,
    selected: false,
    dragging: false,
    positionAbsoluteX: x,
    positionAbsoluteY: 0,
  }) as unknown as Props;
const STABLE_DATA = {};

describe('createFlowOrBarNodeType', () => {
  it('returns one stable wrapper per component and comparator', () => {
    const Flow = () => null;
    expect(createFlowOrBarNodeType(Flow)).toBe(createFlowOrBarNodeType(Flow));
    const blind = createFlowOrBarNodeType(Flow, { ignoresAbsolutePosition: true });
    expect(blind).toBe(createFlowOrBarNodeType(Flow, { ignoresAbsolutePosition: true }));
    expect(blind).not.toBe(createFlowOrBarNodeType(Flow));
  });

  it("skips a built-in renderer's re-render when only the absolute position changes", () => {
    const renderSpy = vi.fn();
    const Flow = (props: Props) => {
      renderSpy(props.positionAbsoluteX);
      return null;
    };
    const Wrapped = createFlowOrBarNodeType(Flow, { ignoresAbsolutePosition: true });

    const { rerender } = render(<Wrapped {...propsAt(0)} />);
    // A dragged ancestor sends this to every descendant on every frame.
    rerender(<Wrapped {...propsAt(40)} />);
    rerender(<Wrapped {...propsAt(80)} />);

    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('passes absolute-position updates through to a host-supplied component', () => {
    const seen: number[] = [];
    const HostFlow = (props: Props) => {
      seen.push(props.positionAbsoluteX);
      return null;
    };
    const Wrapped = createFlowOrBarNodeType(HostFlow);

    const { rerender } = render(<Wrapped {...propsAt(0)} />);
    rerender(<Wrapped {...propsAt(40)} />);

    expect(seen).toEqual([0, 40]);
  });

  it('does not re-render a host-supplied component when no prop changed', () => {
    const renderSpy = vi.fn();
    const HostFlow = () => {
      renderSpy();
      return null;
    };
    const Wrapped = createFlowOrBarNodeType(HostFlow);

    const { rerender } = render(<Wrapped {...propsAt(0)} />);
    rerender(<Wrapped {...propsAt(0)} />);

    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
