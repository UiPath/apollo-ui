import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import type { NodeManifest } from '../../schema/node-definition';
import { resolveLoopPreviewConnectionHandles } from './LoopNode.helpers';

describe('resolveLoopPreviewConnectionHandles', () => {
  it('returns the manifest-configured inner loop handles instead of fixed ids', () => {
    const manifest: NodeManifest = {
      nodeType: 'uipath.control-flow.foreach',
      version: '1.0.0',
      category: 'control-flow',
      tags: ['loop'],
      sortOrder: 0,
      display: {
        label: 'For Each',
        icon: 'repeat',
      },
      handleConfiguration: [
        {
          position: 'left',
          boundary: 'inner',
          handles: [{ id: 'body-entry', type: 'source', handleType: 'output' }],
        },
        {
          position: 'right',
          boundary: 'inner',
          handles: [
            { id: 'body-return', type: 'target', handleType: 'input' },
            { id: 'body-break', type: 'target', handleType: 'input' },
          ],
        },
      ],
    };

    expect(resolveLoopPreviewConnectionHandles(manifest, { nodeId: 'loop-1' })).toEqual({
      sourceHandleId: 'body-entry',
      sourceHandlePosition: Position.Right,
      targetHandleId: 'body-return',
    });
  });

  it('picks the first visible inner target when multiple targets exist', () => {
    const manifest: NodeManifest = {
      nodeType: 'uipath.control-flow.foreach',
      version: '1.0.0',
      category: 'control-flow',
      tags: ['loop'],
      sortOrder: 0,
      display: {
        label: 'For Each',
        icon: 'repeat',
      },
      handleConfiguration: [
        {
          position: 'top',
          boundary: 'inner',
          handles: [{ id: 'loop-source', type: 'source', handleType: 'output' }],
        },
        {
          position: 'bottom',
          boundary: 'inner',
          handles: [
            {
              id: 'path-1',
              label: 'Break',
              type: 'target',
              handleType: 'input',
            },
            {
              id: 'path-2',
              label: 'Continue',
              type: 'target',
              handleType: 'input',
              isDefaultForType: true,
            },
          ],
        },
      ],
    };

    expect(resolveLoopPreviewConnectionHandles(manifest, { nodeId: 'loop-1' })).toEqual({
      sourceHandleId: 'loop-source',
      sourceHandlePosition: Position.Bottom,
      targetHandleId: 'path-1',
    });
  });

  it('returns null when the manifest does not expose both inner loop connections', () => {
    const manifest: NodeManifest = {
      nodeType: 'uipath.control-flow.foreach',
      version: '1.0.0',
      category: 'control-flow',
      tags: ['loop'],
      sortOrder: 0,
      display: {
        label: 'For Each',
        icon: 'repeat',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [{ id: 'input', type: 'target', handleType: 'input' }],
        },
      ],
    };

    expect(resolveLoopPreviewConnectionHandles(manifest, { nodeId: 'loop-1' })).toBeNull();
  });
});
