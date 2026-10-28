import type React from 'react';

/**
 * Sets a native `title` on hover only when the element's text is actually clipped, and clears it
 * otherwise. One measurement per hover, nothing at rest, no React state — a real tooltip web
 * component per cell would undo the row memoization that keeps large tables smooth.
 */
export const showTitleIfClipped: React.MouseEventHandler<HTMLElement> = (event) => {
  const element = event.currentTarget;
  element.title = element.scrollWidth > element.clientWidth ? (element.textContent ?? '') : '';
};
