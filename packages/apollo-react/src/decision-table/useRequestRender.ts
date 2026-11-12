import { useReducer } from 'react';

/** Renders the view once more after a call to the host, so what it keeps for the host's answer is dropped when the host refuses too. */
export const useRequestRender = (): (() => void) => {
  const [, requestRender] = useReducer((count: number) => count + 1, 0);
  return requestRender;
};
