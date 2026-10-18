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
 * Context updates bypass `React.memo`, so the value must stay stable across a selection or
 * data-only change and still rebuild on a structural one.
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
    ...overrides,
  };
}

/** A selection update: new nodes array and `canonicalById`, same `projection` object. */
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

describe('useSequentialMoveActionsValue read-only nodes', () => {
  it('offers no move options and refuses to commit for a locked node', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    const movable = projection.rows.find((row) => row.stepNumber === 2)!.nodeId;
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    const unlocked = renderHook(() =>
      useSequentialMoveActionsValue(makeArgs({ projection, onNodesChange, onEdgesChange }))
    );
    const openOptions = unlocked.result.current.getMoveOptions(movable);
    const upSlot = openOptions.up;
    expect(upSlot).toBeDefined();

    const locked = renderHook(() =>
      useSequentialMoveActionsValue(
        makeArgs({
          projection,
          readOnlyNodeIds: new Set([movable]),
          onNodesChange,
          onEdgesChange,
        })
      )
    );
    expect(locked.result.current.getMoveOptions(movable)).toEqual({
      up: undefined,
      down: undefined,
      indent: undefined,
      outdent: undefined,
    });
    locked.result.current.commitMove(movable, upSlot!);
    expect(onNodesChange).not.toHaveBeenCalled();
    expect(onEdgesChange).not.toHaveBeenCalled();
  });
});

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

    // Re-render once so commit provably reads the current graph, not a stale closure.
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
});
