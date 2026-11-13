import type React from 'react';
import { useEffect, useRef } from 'react';
import { BODY_ROW_HEIGHT_PX } from './constants';
import { isComposing, isFromTextField } from './gridEvents';
import { moveFocusIn, stopAfter } from './popoverFocus';
import { type EditorAnchor, type EditorPlacement, useEditorPlacement } from './useEditorPlacement';
import type { RuleWindow } from './useRuleWindow';

/** The overlay's inline style: its placement, and the row height a grid cell editor sizes itself from. */
type EditorOverlayStyle = React.CSSProperties & Record<'--grid-row-height', string>;

const UNPLACED: EditorPlacement = { top: 0, left: 0 };

const overlayStyle = ({ top, left }: EditorPlacement): EditorOverlayStyle => ({
  top,
  left,
  '--grid-row-height': `${BODY_ROW_HEIGHT_PX}px`,
});

const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();

const PRESSED_CONTROL = 'label, button:not(:disabled), [role="checkbox"], [role="radio"]';

/** Keeps Tab inside: Tab past the last control or Shift+Tab before the first wraps to the other end. */
const wrapTab = (event: React.KeyboardEvent<HTMLElement>) => {
  if (event.key !== 'Tab' || event.defaultPrevented || isComposing(event)) return;
  const { currentTarget, target, shiftKey } = event;
  if (!(target instanceof Element) || stopAfter(currentTarget, target, shiftKey)) return;
  event.preventDefault();
  moveFocusIn(currentTarget, target, shiftKey);
};

const OWN_FOCUS_CONTROL =
  'select, a[href], [tabindex], [contenteditable]:not([contenteditable="false"])';

/** Whether a press lands on a focusable part of the host's editor that is no pressed control, or inside its shadow root, which keep their own default. */
const hostEditorOwns = (event: React.MouseEvent<HTMLElement>, target: Element): boolean => {
  const editor = target.closest('[data-owns-presses]');
  if (!editor) return false;
  const [origin] = event.nativeEvent.composedPath();
  if (origin !== target) return true;
  const control = target.closest(`${PRESSED_CONTROL}, ${OWN_FOCUS_CONTROL}`);
  return control !== null && editor.contains(control) && !control.matches(PRESSED_CONTROL);
};

/** Keeps focus inside on a press, which Safari leaves nowhere: a press on a control focuses it, one on a label focuses its control with no text selected so its click still reaches it, and one off a text field keeps focus where it is. */
const focusPressedControl = (event: React.MouseEvent<HTMLElement>) => {
  const { target } = event;
  if (
    event.defaultPrevented ||
    !(target instanceof Element) ||
    isFromTextField(target) ||
    hostEditorOwns(event, target)
  ) {
    return;
  }
  event.preventDefault();
  const pressed = target.closest<HTMLElement>(PRESSED_CONTROL);
  if (!(pressed instanceof HTMLLabelElement)) {
    pressed?.focus();
    return;
  }
  target.ownerDocument.getSelection()?.removeAllRanges();
  pressed.control?.focus();
};

export interface EditorOverlayProps {
  anchor: EditorAnchor;
  container: RuleWindow['container'];
  ariaLabel: string;
  className: string;
  id?: string;
  dataTestId: string;
  /** A press outside the overlay and its anchor; without it the overlay ignores them. */
  onPressOutside?: () => void;
  /** Mounted once the overlay is placed, so it takes focus where it shows. */
  children: React.ReactNode;
}

/** A popover over the rules at its anchor, keeping its clicks from the view and focus inside it on a press. */
export const EditorOverlay: React.FC<EditorOverlayProps> = ({
  anchor,
  container,
  ariaLabel,
  className,
  id,
  dataTestId,
  onPressOutside,
  children,
}) => {
  const { overlayRef, placement } = useEditorPlacement({ container, anchor });
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;
  const pressOutsideRef = useRef(onPressOutside);
  pressOutsideRef.current = onPressOutside;
  const watchesPresses = onPressOutside !== undefined;
  useEffect(() => {
    if (!watchesPresses) return;
    const press = (event: PointerEvent) => {
      const [origin] = event.composedPath();
      const target = origin instanceof Node ? origin : null;
      const section = container();
      if (overlayRef.current?.contains(target)) return;
      if (section && anchorRef.current(section)?.contains(target)) return;
      pressOutsideRef.current?.();
    };
    document.addEventListener('pointerdown', press, true);
    return () => document.removeEventListener('pointerdown', press, true);
  }, [container, overlayRef, watchesPresses]);
  return (
    <fieldset
      ref={overlayRef}
      id={id}
      aria-label={ariaLabel}
      className={className}
      style={overlayStyle(placement ?? UNPLACED)}
      data-testid={dataTestId}
      onMouseDown={focusPressedControl}
      onKeyDown={wrapTab}
      onClick={stopPropagation}
    >
      {placement && children}
    </fieldset>
  );
};
