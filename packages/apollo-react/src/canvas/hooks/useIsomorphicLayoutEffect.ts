import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * Avoids React's "useLayoutEffect does nothing on the server" warning during
 * SSR while keeping pre-paint timing where it matters on the client.
 */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
