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

/** Where an inline edit's commit key sends the selection: Enter down, Tab right, Shift+Tab left. */
export const commitMoveFor = (event: { key: string; shiftKey: boolean }): CellCommitMove =>
  event.key === 'Enter' ? 'down' : event.shiftKey ? 'left' : 'right';

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

// Controls, composite controls (an input group) and embedded content (a tab panel) own their presses.
const OWNED_PRESS_SELECTOR =
  "button, a, input, textarea, select, label, [contenteditable='true'], " +
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
