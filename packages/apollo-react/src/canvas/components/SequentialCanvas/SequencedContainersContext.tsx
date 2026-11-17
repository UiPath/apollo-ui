import { createContext, type ReactNode, useContext } from 'react';

/**
 * Per-container body presentation on a flow canvas. Provided by the canvas that
 * owns the `sequencedContainerIds` view state; read by ContainerNode for its
 * header switch and by the card-or-bar node dispatcher.
 */
export interface SequencedContainersValue {
  isSequenced: (containerId: string) => boolean;
  /** False when the first slice cannot sequence this body (for example a nested container). */
  canSequence: (containerId: string) => boolean;
  setSequenced: (containerId: string, sequenced: boolean) => void;
}

const SequencedContainersContext = createContext<SequencedContainersValue | undefined>(undefined);

export function SequencedContainersProvider({
  value,
  children,
}: {
  value: SequencedContainersValue;
  children: ReactNode;
}) {
  return (
    <SequencedContainersContext.Provider value={value}>
      {children}
    </SequencedContainersContext.Provider>
  );
}

/** Undefined outside a canvas that supports sequenced containers, so hosts render as before. */
export function useOptionalSequencedContainers(): SequencedContainersValue | undefined {
  return useContext(SequencedContainersContext);
}
