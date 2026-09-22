import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../../utils/testing';

// The component only reads the store through a selector, so the mock hands the
// real selector a stand-in state shaped like ReactFlow's: a `.react-flow`
// wrapper that contains a `.react-flow__renderer` child.
const state = { domNode: null as HTMLDivElement | null };

vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  useStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

const { CanvasPortal } = await import('./CanvasPortal');

function buildReactFlowDom() {
  const wrapper = document.createElement('div');
  wrapper.className = 'react-flow';
  const renderer = document.createElement('div');
  renderer.className = 'react-flow__renderer';
  wrapper.appendChild(renderer);
  document.body.appendChild(wrapper);
  return { wrapper, renderer };
}

describe('CanvasPortal', () => {
  it('portals into the react-flow wrapper, not the renderer', () => {
    const { wrapper, renderer } = buildReactFlowDom();
    state.domNode = wrapper;

    render(
      <CanvasPortal>
        <div data-testid="portaled" />
      </CanvasPortal>
    );

    const portaled = document.querySelector('[data-testid="portaled"]');

    // The renderer is absolutely positioned with a z-index, so it forms a
    // stacking context that would trap the panel below ReactFlow's own
    // `.react-flow__panel` chrome. Mounting on the wrapper keeps the panel a
    // sibling of that chrome instead.
    expect(portaled?.parentElement).toBe(wrapper);
    expect(renderer.contains(portaled as Node)).toBe(false);

    wrapper.remove();
  });

  it('renders nothing until the canvas node is available', () => {
    state.domNode = null;

    render(
      <CanvasPortal>
        <div data-testid="portaled" />
      </CanvasPortal>
    );

    expect(document.querySelector('[data-testid="portaled"]')).toBeNull();
  });

  it('keeps children mounted in the wrapper across re-renders', () => {
    const { wrapper } = buildReactFlowDom();
    state.domNode = wrapper;
    const ref = createRef<HTMLDivElement>();

    const { rerender } = render(
      <CanvasPortal>
        <div ref={ref} data-testid="portaled" />
      </CanvasPortal>
    );

    const first = ref.current;

    rerender(
      <CanvasPortal>
        <div ref={ref} data-testid="portaled" />
      </CanvasPortal>
    );

    expect(ref.current).toBe(first);
    expect(ref.current?.parentElement).toBe(wrapper);

    wrapper.remove();
  });
});
