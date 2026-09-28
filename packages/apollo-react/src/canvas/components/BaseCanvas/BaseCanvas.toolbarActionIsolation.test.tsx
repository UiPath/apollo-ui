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
});
