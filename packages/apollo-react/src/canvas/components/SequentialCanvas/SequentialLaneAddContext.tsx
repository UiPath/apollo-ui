import { createContext, type ReactNode, useContext } from 'react';

export type SequentialLaneAddHandler = (slotId: string) => void;

const SequentialLaneAddContext = createContext<SequentialLaneAddHandler | undefined>(undefined);

export interface SequentialLaneAddProviderProps {
  children: ReactNode;
  /** Opens the Add Node panel for the lane placeholder carrying `slotId`; undefined disables it. */
  onLaneAdd?: SequentialLaneAddHandler;
}

/**
 * Lets lane placeholders open the Add Node panel through one stable callback instead of a
 * per-row closure in `node.data`, so the derivation can reuse placeholder node objects.
 */
export function SequentialLaneAddProvider({ children, onLaneAdd }: SequentialLaneAddProviderProps) {
  return (
    <SequentialLaneAddContext.Provider value={onLaneAdd}>
      {children}
    </SequentialLaneAddContext.Provider>
  );
}

export function useSequentialLaneAdd(): SequentialLaneAddHandler | undefined {
  return useContext(SequentialLaneAddContext);
}
