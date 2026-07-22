import { renderHook } from '@testing-library/react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { makeWireframeFixture } from '../../utils/sequential/fixtures';
import { projectSequence } from '../../utils/sequential/projectSequence';
import type { SequenceProjection } from '../../utils/sequential/sequential.types';
import type { SequentialMoveOptions } from './sequentialMoveActions';
import {
  type UseSequentialMoveActionsValueArgs,
  useSequentialMoveActionsValue,
} from './useSequentialMoveActionsValue';

/**
 * The move-actions value is consumed by every `SequentialStepNode` through
 * context. Because context updates bypass `React.memo`, its identity MUST stay
 * stable across a selection or data-only change, or clicking one bar re-renders
 * all of them. It must still be rebuilt on a structural change so kebab
 * move-availability refreshes. These tests pin both halves of that contract.
 */

function makeArgs(
  overrides: Partial<UseSequentialMoveActionsValueArgs<Node, Edge>> = {}
): UseSequentialMoveActionsValueArgs<Node, Edge> {
  const { nodes, edges } = makeWireframeFixture();
  const projection = projectSequence(nodes, edges);
  return {
    projection,
    nodes,
    edges,
    canonicalById: new Map(nodes.map((node) => [node.id, node])),
    isContainerNode: () => false,
    getDefaultSourceHandleId: () => undefined,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    centerOnNode: vi.fn(),
    ...overrides,
  };
}

/** Mirrors the real component's selection update: a NEW nodes array (one row's
 * `selected` flipped) plus the derived NEW `canonicalById`, while the structural
 * `projection` (fingerprint-keyed, selection-independent) stays the same object. */
function withSelection(
  args: UseSequentialMoveActionsValueArgs<Node, Edge>,
  selectedId: string
): UseSequentialMoveActionsValueArgs<Node, Edge> {
  const nodes = args.nodes.map((node) =>
    node.id === selectedId ? { ...node, selected: true } : node
  );
  return { ...args, nodes, canonicalById: new Map(nodes.map((node) => [node.id, node])) };
}

function firstMovable(
  getMoveOptions: (nodeId: string) => SequentialMoveOptions,
  nodeIds: string[]
) {
  for (const id of nodeIds) {
    const opts = getMoveOptions(id);
    const slot = opts.down ?? opts.up ?? opts.indent ?? opts.outdent;
    if (slot) return { id, slot };
  }
  return undefined;
}

describe('useSequentialMoveActionsValue', () => {
  it('keeps the value identity stable across a selection-only change', () => {
    const args = makeArgs();
    const { result, rerender } = renderHook((props) => useSequentialMoveActionsValue(props), {
      initialProps: args,
    });

    const before = result.current;
    // A click: new nodes array + new canonicalById, same projection.
    rerender(withSelection(args, args.nodes[1]!.id));

    expect(result.current).toBe(before);
  });

  it('rebuilds the value when the structural projection changes', () => {
    const args = makeArgs();
    const { result, rerender } = renderHook((props) => useSequentialMoveActionsValue(props), {
      initialProps: args,
    });

    const before = result.current;
    // A structural mutation yields a fresh projection object.
    const nextProjection: SequenceProjection = projectSequence(args.nodes, args.edges);
    rerender({ ...args, projection: nextProjection });

    expect(result.current).not.toBe(before);
  });

  it('commitMove forwards changes derived from the latest graph', () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    const args = makeArgs({ onNodesChange, onEdgesChange });
    const { result, rerender } = renderHook((props) => useSequentialMoveActionsValue(props), {
      initialProps: args,
    });

    // Re-render once (a selection) so we prove commit reads the CURRENT graph,
    // not a stale closure captured at first render.
    rerender(withSelection(args, args.nodes[0]!.id));

    const movable = firstMovable(
      result.current.getMoveOptions,
      args.nodes.map((node) => node.id)
    );
    expect(movable).toBeDefined();

    result.current.commitMove(movable!.id, movable!.slot);
    expect(onNodesChange).toHaveBeenCalled();
    expect(onEdgesChange).toHaveBeenCalled();
  });

  it('forwards centerOnNode to the provided callback', () => {
    const centerOnNode = vi.fn();
    const args = makeArgs({ centerOnNode });
    const { result } = renderHook((props) => useSequentialMoveActionsValue(props), {
      initialProps: args,
    });

    result.current.centerOnNode('http');
    expect(centerOnNode).toHaveBeenCalledWith('http');
  });
});
