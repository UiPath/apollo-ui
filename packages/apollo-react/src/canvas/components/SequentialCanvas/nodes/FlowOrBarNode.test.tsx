import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createFlowOrBarNodeType } from './FlowOrBarNode';

describe('createFlowOrBarNodeType', () => {
  it('passes absolute-position updates through to a host flow component', () => {
    // A host renderer that reads its absolute position, as BlankCanvasNode does.
    const seen = vi.fn();
    const HostNode = (props: { positionAbsoluteX: number; positionAbsoluteY: number }) => {
      seen(props.positionAbsoluteX, props.positionAbsoluteY);
      return null;
    };
    const Wrapped = createFlowOrBarNodeType(HostNode as never);
    // biome-ignore lint/suspicious/noExplicitAny: minimal NodeProps stub for a focused render test.
    const props = { id: 'host', data: {}, positionAbsoluteX: 0, positionAbsoluteY: 0 } as any;

    const { rerender } = render(<Wrapped {...props} />);
    // Only the ancestor moved: every other prop keeps its identity.
    rerender(<Wrapped {...props} positionAbsoluteX={40} positionAbsoluteY={25} />);

    expect(seen).toHaveBeenLastCalledWith(40, 25);
  });
});
