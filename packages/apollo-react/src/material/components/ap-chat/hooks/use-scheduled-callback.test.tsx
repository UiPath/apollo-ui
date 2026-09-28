import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScheduledCallback } from './use-scheduled-callback';

describe('useScheduledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should schedule a callback with requestAnimationFrame', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useScheduledCallback(callback));

    act(() => {
      result.current();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.runAllTimers();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending callback when called multiple times', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useScheduledCallback(callback));

    // Schedule multiple calls
    act(() => {
      result.current(); // First call
      result.current(); // Second call (should cancel first)
      result.current(); // Third call (should cancel second)
    });

    act(() => {
      vi.runAllTimers();
    });

    // Should only execute once (the last call)
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should use the latest callback when executed', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(({ cb }) => useScheduledCallback(cb), {
      initialProps: { cb: callback1 },
    });

    // Schedule with first callback
    act(() => {
      result.current();
    });

    // Update to second callback before RAF executes
    rerender({ cb: callback2 });

    act(() => {
      vi.runAllTimers();
    });

    // Should call the latest callback
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', () => {
    const callback = vi.fn();
    const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { result, unmount } = renderHook(() => useScheduledCallback(callback));

    // Schedule a callback
    act(() => {
      result.current();
    });

    // Unmount before RAF executes
    unmount();

    // Should have called cancelAnimationFrame
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();

    // RAF should not execute after unmount
    act(() => {
      vi.runAllTimers();
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should return a stable function reference', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useScheduledCallback(cb), {
      initialProps: { cb: callback },
    });

    const firstRef = result.current;

    // Rerender with a new callback
    const newCallback = vi.fn();
    rerender({ cb: newCallback });

    // The returned function reference should remain stable
    expect(result.current).toBe(firstRef);
  });

  it('should handle multiple sequential schedules correctly', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useScheduledCallback(callback));

    // First schedule and execute
    act(() => {
      result.current();
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    // Second schedule and execute
    act(() => {
      result.current();
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should handle callback that throws an error', () => {
    const errorCallback = vi.fn(() => {
      throw new Error('Test error');
    });

    const { result } = renderHook(() => useScheduledCallback(errorCallback));

    act(() => {
      result.current();
    });

    expect(() => {
      act(() => {
        vi.runAllTimers();
      });
    }).toThrow('Test error');

    expect(errorCallback).toHaveBeenCalledTimes(1);
  });

  it('should allow scheduling after a previous callback completes', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useScheduledCallback(callback));

    // First execution
    act(() => {
      result.current();
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    // Schedule again after completion
    act(() => {
      result.current();
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should work with callback that modifies state', () => {
    let counter = 0;
    const callback = vi.fn(() => {
      counter += 1;
    });

    const { result } = renderHook(() => useScheduledCallback(callback));

    act(() => {
      result.current();
    });

    expect(counter).toBe(0);

    act(() => {
      vi.runAllTimers();
    });

    expect(counter).toBe(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cleanup without error when no callback is scheduled', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useScheduledCallback(callback));

    // Unmount without scheduling anything
    expect(() => unmount()).not.toThrow();
  });
});
