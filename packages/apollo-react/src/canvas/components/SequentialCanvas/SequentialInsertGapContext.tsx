import { createContext, useContext } from 'react';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';

export type SetSequentialInsertGapSlot = (slot: InsertionSlot) => void;

const NOOP_SET: SetSequentialInsertGapSlot = () => {};

const SequentialInsertGapContext = createContext<SetSequentialInsertGapSlot>(NOOP_SET);

export const SequentialInsertGapProvider = SequentialInsertGapContext.Provider;

/**
 * Shared sink every `useSequentialInsert()` instance reports its opened slot to, since the
 * instances hold no state of their own. The no-op default keeps isolated edge tests working.
 */
export function useSetSequentialInsertGapSlot(): SetSequentialInsertGapSlot {
  return useContext(SequentialInsertGapContext);
}
