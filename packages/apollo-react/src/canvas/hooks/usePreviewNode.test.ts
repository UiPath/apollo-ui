import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID } from '../constants';
import { NodeTypeRegistry } from '../core/NodeTypeRegistry';
import { resolvePreviewExistingHandle, resolvePreviewExistingHandleId } from './usePreviewNode';

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
