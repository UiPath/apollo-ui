import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NodeStatusContext } from '../components/BaseNode/BaseNode.types';
import { getToolbarActionStore, setToolbarActionStore } from '../hooks/ToolbarActionContext';
import type { NodeManifest } from '../schema/node-definition';
import { CLIPBOARD_TOOLBAR_ACTIONS, DRILL_INTO_TOOLBAR_ACTION } from '../schema/toolbar';
import { resolveToolbar, type ToolbarSelection } from './toolbar-resolver';

const context: NodeStatusContext = { nodeId: 'n1' };

const containerManifest = {
  nodeType: 'loop',
  display: { label: 'Loop', icon: 'repeat', shape: 'container' },
  handleConfiguration: [
    {
      position: 'left',
      boundary: 'outer',
      handles: [{ id: 'in', type: 'target', handleType: 'input' }],
    },
    {
      position: 'left',
      boundary: 'inner',
      handles: [{ id: 'start', type: 'source', handleType: 'output' }],
    },
  ],
} as NodeManifest;

const artifactManifest = {
  nodeType: 'agent',
  display: { label: 'Agent', icon: 'bot', shape: 'square' },
  handleConfiguration: [
    {
      position: 'bottom',
      handles: [{ id: 'tools', type: 'source', handleType: 'artifact' }],
    },
  ],
} as NodeManifest;

const plainManifest = {
  nodeType: 'script',
  display: { label: 'Script', icon: 'code', shape: 'square' },
  handleConfiguration: [
    {
      position: 'left',
      handles: [{ id: 'in', type: 'target', handleType: 'input' }],
    },
  ],
} as NodeManifest;

const actionIds = (manifest: NodeManifest) =>
  (resolveToolbar(manifest, context)?.actions ?? []).map((action) => action.id);

describe('resolveToolbar', () => {
  describe('collapse action', () => {
    it('offers collapse on a container manifest', () => {
      expect(actionIds(containerManifest)).toContain('collapse');
    });

    it('offers collapse on a manifest with an artifact source handle', () => {
      expect(actionIds(artifactManifest)).toContain('collapse');
    });

    it('withholds collapse from a node with neither a body nor artifacts', () => {
      expect(actionIds(plainManifest)).not.toContain('collapse');
    });

    it('offers collapse once when a manifest qualifies both ways', () => {
      const bothManifest = {
        ...containerManifest,
        handleConfiguration: [
          ...containerManifest.handleConfiguration,
          {
            position: 'bottom',
            handles: [{ id: 'tools', type: 'source', handleType: 'artifact' }],
          },
        ],
      } as NodeManifest;

      expect(actionIds(bothManifest).filter((id) => id === 'collapse')).toHaveLength(1);
    });

    it('honours suppressDefaultToolbarActions', () => {
      const suppressed = {
        ...containerManifest,
        suppressDefaultToolbarActions: { design: ['collapse'] },
      } as NodeManifest;

      expect(actionIds(suppressed)).not.toContain('collapse');
    });
  });

  describe('duplicate action ids', () => {
    it('moves a default into the overflow menu when an extension declares it there', () => {
      const extended = {
        ...plainManifest,
        toolbarExtensions: {
          design: {
            actions: [],
            overflowActions: [{ id: 'delete', icon: 'trash', label: 'Remove forever' }],
          },
        },
      } as NodeManifest;

      const toolbar = resolveToolbar(extended, context);

      expect((toolbar?.actions ?? []).map((action) => action.id)).not.toContain('delete');
      expect((toolbar?.overflowActions ?? []).map((action) => action.id)).toEqual(['delete']);
    });

    it('lets a manifest extension override a default of the same id', () => {
      const extended = {
        ...plainManifest,
        toolbarExtensions: {
          design: {
            actions: [{ id: 'delete', icon: 'trash', label: 'Remove forever' }],
          },
        },
      } as NodeManifest;

      const actions = resolveToolbar(extended, context)?.actions ?? [];
      const deletes = actions.filter((action) => action.id === 'delete');

      expect(deletes).toHaveLength(1);
      expect(deletes[0]!.label).toBe('Remove forever');
    });
  });

  describe('nodeData', () => {
    const originalStore = getToolbarActionStore();
    afterEach(() => {
      setToolbarActionStore(originalStore);
    });

    it('passes the third argument through to the handler as nodeData', () => {
      const onToolbarAction = vi.fn();
      setToolbarActionStore({ mode: 'design', onToolbarAction });
      const nodeData = { label: 'Script' };

      const actions = resolveToolbar(plainManifest, context, nodeData)?.actions ?? [];
      actions.find((action) => action.id === 'delete')?.onAction('n1');

      expect(onToolbarAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionId: 'delete', nodeId: 'n1', nodeData })
      );
    });
  });

  describe('drill into', () => {
    const withDrillInto = (manifest: NodeManifest) =>
      ({
        ...manifest,
        toolbarExtensions: { design: { actions: [DRILL_INTO_TOOLBAR_ACTION] } },
      }) as NodeManifest;

    it('offers Drill into on a drillable manifest that lists it', () => {
      expect(
        actionIds(withDrillInto({ ...plainManifest, drillable: true } as NodeManifest))
      ).toContain('drill-into');
    });

    it('withholds it from a manifest that is not drillable', () => {
      expect(actionIds(withDrillInto(plainManifest))).not.toContain('drill-into');
    });

    it('adds nothing to a drillable manifest that does not list it', () => {
      expect(actionIds({ ...plainManifest, drillable: true } as NodeManifest)).not.toContain(
        'drill-into'
      );
    });
  });

  describe('clipboard actions', () => {
    it('take the overflow and replace the default delete', () => {
      const manifest = {
        ...plainManifest,
        toolbarExtensions: {
          design: { actions: [], overflowActions: [...CLIPBOARD_TOOLBAR_ACTIONS] },
        },
      } as NodeManifest;

      const toolbar = resolveToolbar(manifest, context);

      expect((toolbar?.actions ?? []).map((action) => action.id)).not.toContain('delete');
      expect((toolbar?.overflowActions ?? []).map((action) => action.id)).toEqual([
        'copy',
        'cut',
        'paste',
        'delete',
      ]);
    });
  });

  describe('actions that apply to the selection', () => {
    const onToolbarAction = vi.fn();
    const store = { mode: 'design', onToolbarAction };
    const manifest = {
      ...plainManifest,
      toolbarExtensions: {
        design: { actions: [], overflowActions: [...CLIPBOARD_TOOLBAR_ACTIONS] },
      },
    } as NodeManifest;
    const selectionOf = (
      selected: string[]
    ): ToolbarSelection & { selectOnly: ReturnType<typeof vi.fn> } => ({
      selectedNodeIds: () => selected,
      selectOnly: vi.fn(),
    });
    const run = (actionId: string, nodeId: string, selection?: ToolbarSelection) =>
      resolveToolbar(manifest, context, undefined, store, selection)
        ?.overflowActions?.find((action) => action.id === actionId)
        ?.onAction(nodeId);

    afterEach(() => onToolbarAction.mockClear());

    it('acts on the whole selection when the node is part of it', () => {
      const selection = selectionOf(['n1', 'n2']);

      run('cut', 'n1', selection);

      expect(selection.selectOnly).not.toHaveBeenCalled();
      expect(onToolbarAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionId: 'cut', nodeId: 'n1', nodeIds: ['n1', 'n2'] })
      );
    });

    it('selects a node that is not selected, and acts on it alone', () => {
      const selection = selectionOf(['n2']);

      run('delete', 'n1', selection);

      expect(selection.selectOnly).toHaveBeenCalledWith('n1');
      expect(onToolbarAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionId: 'delete', nodeIds: ['n1'] })
      );
    });

    it('acts on the node alone where there is no selection to read', () => {
      run('copy', 'n1');

      expect(onToolbarAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionId: 'copy', nodeIds: ['n1'] })
      );
    });

    it('leaves the selection and the event alone for an action that does not apply to it', () => {
      const selection = selectionOf(['n2']);

      run('paste', 'n1', selection);

      expect(selection.selectOnly).not.toHaveBeenCalled();
      expect(onToolbarAction.mock.calls[0]![0]).not.toHaveProperty('nodeIds');
    });
  });
});
