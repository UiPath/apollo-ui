import { describe, expect, it } from 'vitest';
import type { NodeStatusContext } from '../components/BaseNode/BaseNode.types';
import type { NodeManifest } from '../schema/node-definition';
import { resolveToolbar } from './toolbar-resolver';

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
});
