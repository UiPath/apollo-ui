import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useExecutionStatusLabel } from './useExecutionStatusLabel';

describe('useExecutionStatusLabel', () => {
  it('returns localized labels for every renderable execution status', () => {
    const { result } = renderHook(() => useExecutionStatusLabel());
    const getLabel = result.current;

    expect(getLabel('InProgress')).toBe('In progress');
    expect(getLabel('Completed')).toBe('Completed');
    expect(getLabel('Paused')).toBe('Paused');
    expect(getLabel('Failed')).toBe('Failed');
    expect(getLabel('Cancelled')).toBe('Cancelled');
    expect(getLabel('UserCancelled')).toBe('Cancelled');
    expect(getLabel('Terminated')).toBe('Terminated');
    expect(getLabel('NotExecuted')).toBe('Not started');
    expect(getLabel('Warning')).toBe('Warning');
  });

  it('returns an empty string for undefined or unknown statuses', () => {
    const { result } = renderHook(() => useExecutionStatusLabel());
    const getLabel = result.current;

    expect(getLabel(undefined)).toBe('');
    // Unknown statuses still type-check via the string union, but in practice the
    // upstream API can return values we don't render an icon for; treat them as empty.
    expect(getLabel('Unknown' as never)).toBe('');
  });
});
