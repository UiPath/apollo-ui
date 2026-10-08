const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focuses the tabbable element before or after `from` in document order, as
 * Tab would from it, and returns whether one took focus.
 *
 * Looks in `scope` when given, and otherwise in `from`'s own tree: inside a
 * shadow root, as under PortalContainerProvider, the document cannot see the
 * picker's controls. Radix focus guards, which only bounce focus back,
 * anything inside `from` itself, and controls that are not rendered are
 * skipped.
 */
/**
 * Whether an element is rendered and could take focus. A tab index says an
 * element may be a tab stop, not that it is shown: a control hidden with CSS
 * keeps its tab index but cannot be focused.
 */
function isShown(element: HTMLElement) {
  if (element.closest('[hidden], [inert]')) return false;
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true });
  }
  // Without `checkVisibility`, walk up for what hides it from rendering.
  for (let node: Element | null = element; node; node = node.parentElement) {
    const style = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (style?.display === 'none') return false;
    if (node === element && style?.visibility === 'hidden') return false;
  }
  return true;
}

export function focusBeside(from: Element, backwards: boolean, scope?: ParentNode) {
  const root = scope ?? (from.getRootNode() as Document | ShadowRoot);
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.hasAttribute('data-radix-focus-guard') &&
      !from.contains(element) &&
      isShown(element)
  );
  const isAfter = (element: HTMLElement) =>
    Boolean(from.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
  const ordered = backwards
    ? candidates.filter((element) => !isAfter(element)).reverse()
    : candidates.filter(isAfter);
  // The nearest one that actually takes focus. A call to `focus` that does
  // nothing, on a control a check above could not see was unfocusable, is
  // not taken for success: the search goes on, and failing that the caller
  // falls back.
  for (const target of ordered) {
    target.focus();
    const active = (target.getRootNode() as Document | ShadowRoot).activeElement;
    if (active === target) return true;
  }
  return false;
}
