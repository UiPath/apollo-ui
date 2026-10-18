import {
  createContext,
  type MutableRefObject,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from 'react';
import type { PendingSequentialInsert } from './edges/sequentialInsert';

interface SequentialInsertState {
  pending: MutableRefObject<PendingSequentialInsert | undefined>;
}

const SequentialInsertStateContext = createContext<SequentialInsertState | undefined>(undefined);

/** Per-canvas insertion state shared by connector buttons and AddNodeManager. */
export function SequentialInsertStateProvider({ children }: { children: ReactNode }) {
  const pending = useRef<PendingSequentialInsert | undefined>(undefined);
  // Every connector edge reads this context; a fresh wrapper object per render would
  // re-render all of them on each host render.
  const value = useMemo<SequentialInsertState>(() => ({ pending }), []);
  return (
    <SequentialInsertStateContext.Provider value={value}>
      {children}
    </SequentialInsertStateContext.Provider>
  );
}

export function useOptionalSequentialInsertState(): SequentialInsertState | undefined {
  return useContext(SequentialInsertStateContext);
}
