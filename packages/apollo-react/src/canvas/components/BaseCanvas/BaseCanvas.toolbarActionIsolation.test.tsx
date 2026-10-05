import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { NodeRegistryProvider } from '../../core';
import {
  getToolbarActionStore,
  type ToolbarActionStore,
  useToolbarActionStoreContext,
} from '../../hooks/ToolbarActionContext';
import type { NodeManifest } from '../../schema/node-definition';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import type { NodeStatusContext } from '../BaseNode/BaseNode.types';
import { BaseCanvas } from './BaseCanvas';
import { useBaseCanvasMode } from './BaseCanvasModeProvider';

// Two side-by-side read-only diff panes are both `BaseCanvas`, each wrapped in
// its own `ReactFlowProvider` + `NodeRegistryProvider` - mirrors how a real
// consumer mounts two canvases at once.
const renderCanvas = (
  props: {
    mode: 'view' | 'design';
    onToolbarAction: (e: unknown) => void;
    breakpoints: Set<string>;
  },
  onRead: (store: ToolbarActionStore | undefined) => void
) => {
  function Probe() {
    onRead(useToolbarActionStoreContext());
    return null;
  }

  return render(
    <ReactFlowProvider>
      <NodeRegistryProvider>
        <BaseCanvas nodes={[]} edges={[]} {...props}>
          <Probe />
        </BaseCanvas>
      </NodeRegistryProvider>
    </ReactFlowProvider>
  );
};

const manifest: NodeManifest = {
  nodeType: 'script',
  display: { label: 'Script', icon: 'code', shape: 'square' },
  handleConfiguration: [],
} as unknown as NodeManifest;

const nodeContext: NodeStatusContext = { nodeId: 'n1' };

describe('two BaseCanvas instances mounted side by side (e.g. a before/after diff view)', () => {
  it('keeps each canvas own mode/handler/breakpoints isolated, and survives the other unmounting', () => {
    const onToolbarActionA = vi.fn();
    const onToolbarActionB = vi.fn();

    let storeA: ToolbarActionStore | undefined;
    let storeB: ToolbarActionStore | undefined;

    renderCanvas(
      {
        mode: 'view',
        onToolbarAction: onToolbarActionA,
        breakpoints: new Set(['a']),
      },
      (s) => {
        storeA = s;
      }
    );
    const { unmount: unmountB } = renderCanvas(
      {
        mode: 'design',
        onToolbarAction: onToolbarActionB,
        breakpoints: new Set(['b']),
      },
      (s) => {
        storeB = s;
      }
    );

    // Both mounted at once: each canvas resolves its own store, not the other's.
    expect(storeA).toEqual({
      mode: 'view',
      onToolbarAction: onToolbarActionA,
      breakpoints: new Set(['a']),
    });
    expect(storeB).toEqual({
      mode: 'design',
      onToolbarAction: onToolbarActionB,
      breakpoints: new Set(['b']),
    });

    // The store each canvas resolves is exactly what a node inside it would
    // get from `resolveToolbar` - prove the handler wiring is isolated too,
    // by invoking a resolved action's `onAction` directly.
    const actionsB = resolveToolbar(manifest, nodeContext, { store: storeB })?.actions ?? [];
    const deleteAction = actionsB.find((action) => action.id === 'delete');
    expect(deleteAction).toBeDefined();

    deleteAction?.onAction('node-1');
    expect(onToolbarActionB).toHaveBeenCalledWith(
      expect.objectContaining({
        actionId: 'delete',
        nodeId: 'node-1',
        mode: 'design',
      })
    );
    expect(onToolbarActionA).not.toHaveBeenCalled();

    // Canvas B (mode="design") unmounts - e.g. the diff view collapses back to
    // a single pane. Canvas A (mode="view") is still mounted and must keep its
    // own mode/handler/breakpoints exactly as before.
    unmountB();

    expect(storeA).toEqual({
      mode: 'view',
      onToolbarAction: onToolbarActionA,
      breakpoints: new Set(['a']),
    });
  });

  it('keeps two mode="view" canvases independent as well', () => {
    const onToolbarActionA = vi.fn();
    const onToolbarActionB = vi.fn();

    let storeA: ToolbarActionStore | undefined;
    let storeB: ToolbarActionStore | undefined;

    const { unmount: unmountA } = renderCanvas(
      {
        mode: 'view',
        onToolbarAction: onToolbarActionA,
        breakpoints: new Set(['before']),
      },
      (s) => {
        storeA = s;
      }
    );
    renderCanvas(
      {
        mode: 'view',
        onToolbarAction: onToolbarActionB,
        breakpoints: new Set(['after']),
      },
      (s) => {
        storeB = s;
      }
    );

    expect(storeA?.onToolbarAction).toBe(onToolbarActionA);
    expect(storeA?.breakpoints).toEqual(new Set(['before']));
    expect(storeB?.onToolbarAction).toBe(onToolbarActionB);
    expect(storeB?.breakpoints).toEqual(new Set(['after']));

    // Unmount the earlier-mounted canvas this time - the survivor (B) must be
    // unaffected regardless of mount order.
    unmountA();

    expect(storeB?.onToolbarAction).toBe(onToolbarActionB);
    expect(storeB?.breakpoints).toEqual(new Set(['after']));
  });

  it('still writes the module-level store for readers outside any canvas', () => {
    const onToolbarAction = vi.fn();
    const { unmount } = renderCanvas(
      { mode: 'view', onToolbarAction, breakpoints: new Set(['a']) },
      () => {}
    );

    expect(getToolbarActionStore()).toEqual({
      mode: 'view',
      onToolbarAction,
      breakpoints: new Set(['a']),
    });

    unmount();
    expect(getToolbarActionStore().onToolbarAction).toBeUndefined();
  });

  describe('module-level store with several canvases', () => {
    const canvas = (mode: 'view' | 'design', onToolbarAction: () => void) => (
      <ReactFlowProvider>
        <NodeRegistryProvider>
          <BaseCanvas nodes={[]} edges={[]} mode={mode} onToolbarAction={onToolbarAction} />
        </NodeRegistryProvider>
      </ReactFlowProvider>
    );
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    it('follows the newest mounted canvas and falls back to the survivor when it unmounts', () => {
      const a = render(canvas('view', handlerA));
      const b = render(canvas('design', handlerB));
      expect(getToolbarActionStore().onToolbarAction).toBe(handlerB);

      b.unmount();
      expect(getToolbarActionStore()).toMatchObject({ mode: 'view', onToolbarAction: handlerA });

      a.unmount();
      expect(getToolbarActionStore()).toEqual({
        mode: 'design',
        onToolbarAction: undefined,
        breakpoints: undefined,
      });
    });

    it('keeps the newest canvas when an older one unmounts', () => {
      const a = render(canvas('view', handlerA));
      const b = render(canvas('design', handlerB));

      a.unmount();
      expect(getToolbarActionStore()).toMatchObject({ mode: 'design', onToolbarAction: handlerB });

      b.unmount();
      expect(getToolbarActionStore().onToolbarAction).toBeUndefined();
    });

    it('ignores updates from a canvas that is not the newest', () => {
      const a = render(canvas('view', handlerA));
      const b = render(canvas('view', handlerB));

      a.rerender(canvas('design', vi.fn()));
      expect(getToolbarActionStore()).toMatchObject({ mode: 'view', onToolbarAction: handlerB });

      b.unmount();
      expect(getToolbarActionStore().mode).toBe('design');
      a.unmount();
    });
  });

  it("gives the toolbar store BaseCanvas's own default mode when none is passed", () => {
    let store: ToolbarActionStore | undefined;
    let canvasMode: string | undefined;
    function Probe() {
      store = useToolbarActionStoreContext();
      canvasMode = useBaseCanvasMode().mode;
      return null;
    }

    render(
      <ReactFlowProvider>
        <NodeRegistryProvider>
          <BaseCanvas nodes={[]} edges={[]}>
            <Probe />
          </BaseCanvas>
        </NodeRegistryProvider>
      </ReactFlowProvider>
    );

    expect(canvasMode).toBe('view');
    expect(store?.mode).toBe(canvasMode);
  });
});
