import type React from 'react';
import type { CellCommitMove } from './gridTypes';

/**
 * Whether an event came from a text field inside a grid — an inline rename, an open cell editor.
 * Clipboard and destructive keys must yield to it: its events bubble up to the grid's own handlers,
 * and stopping the keydown does not stop the browser's separate copy/cut/paste events.
 */
export const isFromTextField = (target: EventTarget | null): boolean =>
  target instanceof Element && !!target.closest("input, textarea, [contenteditable='true']");

type ShortcutKeyEvent = Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'key'>;

/** Ctrl/Cmd+Z. Alt excluded so AltGr-composed characters never trigger an undo. */
export const isUndoKey = (event: ShortcutKeyEvent): boolean =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey &&
  event.key.toLowerCase() === 'z';

/** Ctrl/Cmd+Shift+Z, or the Windows-conventional Ctrl+Y. */
export const isRedoKey = (event: ShortcutKeyEvent): boolean =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  (event.shiftKey ? event.key.toLowerCase() === 'z' : event.key.toLowerCase() === 'y');

/** The focused element as a node's own document or shadow root sees it. */
export const activeElementOf = (node: Node): Element | null => {
  const root = node.getRootNode();
  return (root instanceof ShadowRoot ? root.activeElement : null) ?? document.activeElement;
};

/** Whether nothing on the page has focus, as once the focused element is removed: focus rests on the body, or on the host of a node's shadow root. */
export const hasLostFocus = (node: Node): boolean => {
  const root = node.getRootNode();
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return (
    active === null ||
    active === document.body ||
    (root instanceof ShadowRoot && active === root.host)
  );
};

/** Whether focus is still on `from`, on the view itself, or lost, so the view may move it. */
export const focusStays = (view: HTMLElement | null, from: Element | null | undefined): boolean => {
  if (!view) return false;
  const focused = activeElementOf(view);
  return hasLostFocus(view) || focused === view || focused === from;
};

const GESTURES = ['pointerdown', 'keydown', 'click'] as const;

/** Calls `onGesture` once on the next press, key or click anywhere in a node's document, and returns what stops waiting for it. */
export const onNextGesture = (node: Node, onGesture: () => void): (() => void) => {
  const target = node.ownerDocument ?? document;
  const stop = () => {
    for (const type of GESTURES) target.removeEventListener(type, listener, true);
  };
  const listener = () => {
    stop();
    onGesture();
  };
  for (const type of GESTURES) target.addEventListener(type, listener, true);
  return stop;
};

/** Where an inline edit's commit key sends the selection: Enter down, Tab right, Shift+Tab left. */
export const commitMoveFor = (event: { key: string; shiftKey: boolean }): CellCommitMove =>
  event.key === 'Enter' ? 'down' : event.shiftKey ? 'left' : 'right';

export const isComposing = (event: React.KeyboardEvent): boolean =>
  event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;

export const isInList = (target: EventTarget): boolean =>
  target instanceof Element && target.closest('[role="listbox"]') !== null;

/** Whether a press landed on an element's scrollbar, which sits outside its client area. */
const isOnScrollbar = (element: Element, event: React.PointerEvent): boolean => {
  // An inline element has no client box, and so no scrollbar.
  if (element.clientWidth === 0 && element.clientHeight === 0) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left - element.clientLeft;
  const y = event.clientY - rect.top - element.clientTop;
  return x >= element.clientWidth || y >= element.clientHeight;
};

/** Whether a press landed on the container's own empty space rather than on its content. */
export const isBlankContainerPress = (event: React.PointerEvent<HTMLElement>): boolean =>
  event.target === event.currentTarget && !isOnScrollbar(event.currentTarget, event);

// Controls, composite controls (an input group) and embedded content (a tab panel, a grid) own their presses.
// `[data-owns-presses]` marks the rest: a label, or a shadow-root editor whose presses arrive at its host.
const OWNED_PRESS_SELECTOR =
  "button, a, input, textarea, select, label, [contenteditable='true'], [data-grid], [data-owns-presses], " +
  "[role='button'], [role='link'], [role='menuitem'], [role='combobox'], [role='checkbox'], [role='switch'], [role='tab'], [role='option'], [role='slider'], " +
  "[role='group'], [role='tabpanel']";

/** Whether a press landed on chrome's empty area rather than on a control, content or a scrollbar inside it. */
const isInertChromePress = (event: React.PointerEvent<HTMLElement>): boolean => {
  const chrome = event.currentTarget;
  // The DOM, not React's tree: a portaled menu still bubbles its events through the chrome.
  if (
    event.button !== 0 ||
    !(event.target instanceof Element) ||
    !chrome.contains(event.target) ||
    isOnScrollbar(event.target, event)
  ) {
    return false;
  }
  const owner = event.target.closest(OWNED_PRESS_SELECTOR);
  return !owner || !chrome.contains(owner);
};

/** A chrome's `onPointerDown`, reporting a press on its empty area. */
export const emptyAreaPressHandler =
  (onEmptyAreaPress: (() => void) | undefined) =>
  (event: React.PointerEvent<HTMLElement>): void => {
    if (onEmptyAreaPress && isInertChromePress(event)) {
      onEmptyAreaPress();
    }
  };
