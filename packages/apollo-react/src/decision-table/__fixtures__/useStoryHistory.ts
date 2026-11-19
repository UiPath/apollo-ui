import { useState } from 'react';

interface History<T> {
  past: readonly T[];
  present: T;
  future: readonly T[];
}

/** A story host's state with the undo and redo steps a host's history gives the view. */
export const useStoryHistory = <T>(initial: () => T) => {
  const [history, setHistory] = useState<History<T>>(() => ({
    past: [],
    present: initial(),
    future: [],
  }));
  const set = (next: (current: T) => T) =>
    setHistory(({ past, present }) => ({
      past: [...past, present],
      present: next(present),
      future: [],
    }));
  const onUndo = () =>
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (previous === undefined) return current;
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  const onRedo = () =>
    setHistory((current) => {
      const [next, ...future] = current.future;
      if (next === undefined) return current;
      return { past: [...current.past, current.present], present: next, future };
    });
  return { state: history.present, set, onUndo, onRedo };
};
