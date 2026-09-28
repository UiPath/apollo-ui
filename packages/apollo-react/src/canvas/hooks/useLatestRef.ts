import { useRef } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
