import { createContext, useContext } from 'react';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';

export type SetSequentialInsertGapSlot = (slot: InsertionSlot) => void;

const NOOP_SET: SetSequentialInsertGapSlot = () => {};

const SequentialInsertGapContext = createContext<SetSequentialInsertGapSlot>(NOOP_SET);

/** Provided by `SequentialCanvas.tsx`, which owns the actual state + the auto-clear-on-close effect. */
export const SequentialInsertGapProvider = SequentialInsertGapContext.Provider;

/**
 * The setter every `useSequentialInsert()` call site's `startInsert` invokes
 * to report the slot an Add Node panel just opened for -- both
 * `SequentialCanvas.tsx`'s own terminal-placeholder callsite and every
 * `SequentialConnectorEdge`'s "+" button are independent hook instances with
 * no state of their own, so the slot needs a SHARED sink for the insert
 * -preview -gap post-pass to react regardless of which
 * affordance started the insert. `SequentialCanvas.tsx` owns clearing it
 * (via `usePreviewNode` transitioning closed, covering both cancel and
 * commit). A no-op default keeps isolated edge stories/tests (no
 * `SequentialCanvas` mounted) working unchanged.
 */
export function useSetSequentialInsertGapSlot(): SetSequentialInsertGapSlot {
  return useContext(SequentialInsertGapContext);
}
