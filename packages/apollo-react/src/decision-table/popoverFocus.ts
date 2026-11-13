const TABBABLE =
  'input, select, textarea, button, a[href], [tabindex], [contenteditable]:not([contenteditable="false"])';

/** The controls Tab stops on inside `root`, in order; a group that hands its focus to a control inside it, as a radio group does, is not one. */
export const tabbablesIn = (root: Element): HTMLElement[] => {
  const stops = [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]')
  );
  return stops.filter((stop) => !stops.some((other) => other !== stop && stop.contains(other)));
};

const after = (from: Element, stop: Element): boolean =>
  !stop.contains(from) &&
  (from.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

const before = (from: Element, stop: Element): boolean =>
  !stop.contains(from) &&
  (from.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;

/** The control inside `root` that Tab, or Shift+Tab when `backward`, reaches from `from`, or undefined at that end. */
export const stopAfter = (
  root: Element,
  from: Element,
  backward: boolean
): HTMLElement | undefined => {
  const stops = tabbablesIn(root);
  return backward
    ? [...stops].reverse().find((stop) => before(from, stop))
    : stops.find((stop) => after(from, stop));
};

/** Moves focus from `from` to the next control inside `root`, or the previous one, wrapping at both ends. */
export const moveFocusIn = (root: Element, from: Element, backward: boolean) => {
  const stops = tabbablesIn(root);
  const next = stopAfter(root, from, backward) ?? (backward ? stops.at(-1) : stops[0]);
  next?.focus();
};
