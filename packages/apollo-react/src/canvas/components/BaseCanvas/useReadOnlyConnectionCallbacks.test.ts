import { renderHook } from '@testing-library/react';
import type {
  Connection,
  Edge,
  FinalConnectionState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { useReadOnlyConnectionCallbacks } from './useReadOnlyConnectionCallbacks';

const edge: Edge = { id: 'locked-free', source: 'locked', target: 'free' };
const lockedToFree: Connection = {
  source: 'locked',
  target: 'free',
  sourceHandle: null,
  targetHandle: null,
};
const lockedToOutside: Connection = {
  source: 'locked',
  target: 'outside',
  sourceHandle: null,
  targetHandle: null,
};
// Only forwarded, never inspected, by the guards.
const connectionState = {} as FinalConnectionState;
const mouseUp = new MouseEvent('mouseup');

type Options = Parameters<typeof useReadOnlyConnectionCallbacks<Edge>>[0];

const renderCallbacks = (initialProps: Options) =>
  renderHook((props: Options) => useReadOnlyConnectionCallbacks(props), { initialProps });

const bothLocked: ReadonlySet<string> = new Set(['locked', 'free']);

describe('useReadOnlyConnectionCallbacks', () => {
  it('rejects a connection between two locked nodes without consulting the consumer', () => {
    const isValidConnection = vi.fn(() => true);
    const { result, rerender } = renderCallbacks({
      readOnlyNodeIds: new Set(),
      isValidConnection,
    });
    // XYFlow captures the wrapper when the gesture starts, so hold the initial
    // reference and lock afterwards: the guard must read the current lock set.
    const capturedAtPointerDown = result.current.guardedIsValidConnection;

    rerender({ readOnlyNodeIds: bothLocked, isValidConnection });

    expect(capturedAtPointerDown(lockedToFree)).toBe(false);
    expect(isValidConnection).not.toHaveBeenCalled();
  });

  it('drops connect, reconnect, and reconnect-end for a frozen connection', () => {
    const onConnect = vi.fn();
    const onReconnect = vi.fn();
    // Guarding reconnect-end matters: consumers delete the edge there when no
    // reconnect landed, which would remove a frozen edge by the back door.
    const onReconnectEnd = vi.fn();
    const { result, rerender } = renderCallbacks({
      readOnlyNodeIds: new Set(),
      onConnect,
      onReconnect,
      onReconnectEnd,
    });
    const { guardedOnConnect, guardedOnReconnect, guardedOnReconnectEnd } = result.current;

    rerender({ readOnlyNodeIds: bothLocked, onConnect, onReconnect, onReconnectEnd });

    guardedOnConnect?.(lockedToFree);
    guardedOnReconnect?.(edge, lockedToOutside);
    guardedOnReconnectEnd?.(mouseUp, edge, 'target', connectionState);

    expect(onConnect).not.toHaveBeenCalled();
    expect(onReconnect).not.toHaveBeenCalled();
    expect(onReconnectEnd).not.toHaveBeenCalled();
  });

  it('forwards every callback when only one endpoint is locked', () => {
    const isValidConnection = vi.fn(() => true);
    const onConnect = vi.fn();
    const onReconnect = vi.fn();
    const onReconnectEnd = vi.fn();
    const { result } = renderCallbacks({
      readOnlyNodeIds: new Set(['locked']),
      isValidConnection,
      onConnect,
      onReconnect,
      onReconnectEnd,
    });

    expect(result.current.guardedIsValidConnection(lockedToFree)).toBe(true);
    result.current.guardedOnConnect?.(lockedToFree);
    result.current.guardedOnReconnect?.(edge, lockedToFree);
    result.current.guardedOnReconnectEnd?.(mouseUp, edge, 'target', connectionState);

    expect(isValidConnection).toHaveBeenCalledWith(lockedToFree);
    expect(onConnect).toHaveBeenCalledWith(lockedToFree);
    expect(onReconnect).toHaveBeenCalledWith(edge, lockedToFree);
    expect(onReconnectEnd).toHaveBeenCalledWith(mouseUp, edge, 'target', connectionState);
  });

  it('accepts a connection when no consumer validator is provided', () => {
    const { result } = renderCallbacks({ readOnlyNodeIds: new Set(['locked']) });

    expect(result.current.guardedIsValidConnection(lockedToFree)).toBe(true);
  });

  // BaseCanvas forwards these straight to ReactFlow, so an absent consumer
  // callback must stay absent rather than become a no-op handler.
  it('leaves optional callbacks undefined when the consumer provides none', () => {
    const { result } = renderCallbacks({ readOnlyNodeIds: bothLocked });

    expect(result.current.guardedOnConnect).toBeUndefined();
    expect(result.current.guardedOnReconnect).toBeUndefined();
    expect(result.current.guardedOnReconnectEnd).toBeUndefined();
  });
});
