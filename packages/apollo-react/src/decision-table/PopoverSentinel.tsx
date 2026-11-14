import type React from 'react';
import { POPOVER_SENTINEL_CLASS } from './sentenceStyles';

const SENTINEL = 'data-popover-sentinel';

/** Whether `target` is one of a popover's sentinels. */
export const isSentinel = (target: EventTarget | null): boolean =>
  target instanceof Element && target.hasAttribute(SENTINEL);

/** The sentinel before a popover's controls under `root`. */
export const startSentinelIn = (root: ParentNode): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[${SENTINEL}]`);

/** An unseen stop at one end of a popover's controls, which Tab reaches only on its way out. */
export const PopoverSentinel: React.FC = () => (
  // biome-ignore lint/a11y/noNoninteractiveTabindex: a stop in the browser's own Tab order is what tells Tab leaving the popover
  <span tabIndex={0} className={POPOVER_SENTINEL_CLASS} data-popover-sentinel="" />
);
