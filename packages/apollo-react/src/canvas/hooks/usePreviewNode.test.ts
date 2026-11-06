import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID } from '../constants';
import { NodeTypeRegistry } from '../core/NodeTypeRegistry';
import {
  previewEdgeSignatureSelector,
  resolvePreviewConnectionHandle,
  resolvePreviewExistingHandle,
  resolvePreviewExistingHandleId,
} from './usePreviewNode';

describe('resolvePreviewExistingHandleId', () => {
  it('uses canonical metadata when a derived preview edge renders on a view-only source handle', () => {
    const edge: Edge = {
      id: 'incoming-preview',
      source: 'existing',
      sourceHandle: 'seq-source',
      target: PREVIEW_NODE_ID,
      targetHandle: 'input',
      data: { previewConnectionHandleId: 'success' },
    };

    expect(resolvePreviewExistingHandleId(edge)).toBe('success');
  });

  it('uses canonical metadata when a derived preview edge renders on a view-only target handle', () => {
    const edge: Edge = {
      id: 'outgoing-preview',
      source: PREVIEW_NODE_ID,
      sourceHandle: 'output',
      target: 'existing',
      targetHandle: 'seq-target',
      data: { previewConnectionHandleId: 'input' },
    };

    expect(resolvePreviewExistingHandleId(edge)).toBe('input');
  });

  it('keeps the normal rendered-handle fallback for non-derived preview edges', () => {
    expect(
      resolvePreviewExistingHandleId({
        id: 'ordinary-preview',
        source: 'existing',
        sourceHandle: 'custom-output',
        target: PREVIEW_NODE_ID,
      })
    ).toBe('custom-output');
  });

  it('treats an empty-string handle id as absent, as the flow canvas always has', () => {
    expect(
      resolvePreviewExistingHandleId({
        id: 'empty-handle',
        source: 'existing',
        sourceHandle: '',
        target: PREVIEW_NODE_ID,
      })
    ).toBe('output');
    expect(
      resolvePreviewExistingHandleId({
        id: 'empty-target-handle',
        source: PREVIEW_NODE_ID,
        target: 'existing',
        targetHandle: '',
        data: { previewConnectionHandleId: '' },
      })
    ).toBe('input');
  });
});

describe('resolvePreviewExistingHandle', () => {
  const registry = new NodeTypeRegistry();
  registry.registerNodeManifests([
    {
      nodeType: 'script',
      version: '1',
      category: 'actions',
      display: { label: 'Script' },
      tags: [],
      handleConfiguration: [
        {
          position: 'right',
          handles: [
            { id: 'success', type: 'source', handleType: 'output' },
            { id: 'error', type: 'source', handleType: 'output' },
          ],
        },
      ],
    },
  ]);

  it('maps generic output to the manifest default when no literal output handle exists', () => {
    expect(resolvePreviewExistingHandle(registry, 'script', 'output', 'source')).toMatchObject({
      handleId: 'success',
      manifest: { id: 'success' },
    });
  });

  it('does not hide an unknown explicit handle behind the default', () => {
    expect(resolvePreviewExistingHandle(registry, 'script', 'unknown', 'source')).toEqual({
      handleId: 'unknown',
      manifest: undefined,
    });
  });
});

describe('resolvePreviewConnectionHandle (flow canvas connect-end path)', () => {
  const registry = new NodeTypeRegistry();
  const scriptManifest = {
    nodeType: 'script',
    version: '1',
    category: 'actions',
    display: { label: 'Script' },
    tags: [],
    handleConfiguration: [
      {
        position: 'right' as const,
        handles: [
          { id: 'success', type: 'source' as const, handleType: 'output' as const },
          { id: 'error', type: 'source' as const, handleType: 'output' as const },
        ],
      },
    ],
  };
  const fanOutManifest = {
    nodeType: 'fan-out',
    version: '1',
    category: 'actions',
    display: { label: 'Fan out' },
    tags: [],
    handleConfiguration: [
      {
        position: 'right' as const,
        handles: [
          {
            id: 'items{n}',
            type: 'source' as const,
            handleType: 'output' as const,
            repeat: true,
          },
          { id: 'items-done', type: 'source' as const, handleType: 'output' as const },
        ],
      },
    ],
  };
  registry.registerNodeManifests([scriptManifest, fanOutManifest]);

  it('resolves the generic output a connect-end drag seeds to the manifest default', () => {
    // useAddNodeOnConnectEnd defaults a null handle to 'output'; the preview edge
    // then reads `sourceHandle: 'output'` against a manifest with no such handle.
    const previewEdge: Edge = {
      id: 'preview',
      source: 'existing',
      sourceHandle: 'output',
      target: PREVIEW_NODE_ID,
    };
    const existingHandleId = resolvePreviewExistingHandleId(previewEdge);
    const resolved = resolvePreviewConnectionHandle(
      registry,
      registry.getManifest('script'),
      'script',
      existingHandleId,
      'source'
    );
    expect(resolved.handleId).toBe('success');
    expect(resolved.manifest?.id).toBe('success');
  });

  it('prefers an exact handle id over a repeat-handle prefix match', () => {
    const resolved = resolvePreviewConnectionHandle(
      registry,
      registry.getManifest('fan-out'),
      'fan-out',
      'items-done',
      'source'
    );
    expect(resolved).toMatchObject({ handleId: 'items-done', manifest: { id: 'items-done' } });
  });

  it('still matches an expanded repeat handle by prefix when no exact id exists', () => {
    const resolved = resolvePreviewConnectionHandle(
      registry,
      registry.getManifest('fan-out'),
      'fan-out',
      'items3',
      'source'
    );
    expect(resolved).toMatchObject({ handleId: 'items3', manifest: { id: 'items{n}' } });
  });
});

describe('previewEdgeSignatureSelector', () => {
  const previewEdge: Edge = {
    id: 'preview-edge',
    source: 'existing',
    sourceHandle: 'output',
    target: PREVIEW_NODE_ID,
  };
  const stateWith = (selected: boolean) =>
    ({
      edges: [{ id: 'plain', source: 'x', target: 'y' }, previewEdge],
      nodeLookup: new Map([[PREVIEW_NODE_ID, { id: PREVIEW_NODE_ID, selected }]]),
    }) as unknown as Parameters<typeof previewEdgeSignatureSelector>[0];

  it('does not touch the edges while no preview node is selected', () => {
    const state = stateWith(false);
    const edges = state.edges;
    const spy = { touched: false };
    Object.defineProperty(state, 'edges', {
      get() {
        spy.touched = true;
        return edges;
      },
    });
    expect(previewEdgeSignatureSelector(state)).toBe('');
    expect(spy.touched).toBe(false);
  });

  it('keys every connecting preview edge once the preview node is selected', () => {
    expect(previewEdgeSignatureSelector(stateWith(true))).toBe(
      'preview-edge,existing,output,,false'
    );
  });
});
