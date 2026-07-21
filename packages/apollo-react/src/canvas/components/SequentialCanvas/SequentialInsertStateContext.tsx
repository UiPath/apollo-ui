import { createContext, type MutableRefObject, type ReactNode, useContext, useRef } from 'react';
import type { PendingSequentialInsert } from './edges/sequentialInsert';

interface SequentialInsertState {
  pending: MutableRefObject<PendingSequentialInsert | undefined>;
}

const SequentialInsertStateContext = createContext<SequentialInsertState | undefined>(undefined);

/** Per-canvas insertion state shared by connector buttons and AddNodeManager. */
export function SequentialInsertStateProvider({ children }: { children: ReactNode }) {
  const pending = useRef<PendingSequentialInsert | undefined>(undefined);
  return (
    <SequentialInsertStateContext.Provider value={{ pending }}>
      {children}
    </SequentialInsertStateContext.Provider>
  );
}

export function useOptionalSequentialInsertState(): SequentialInsertState | undefined {
  return useContext(SequentialInsertStateContext);
}
