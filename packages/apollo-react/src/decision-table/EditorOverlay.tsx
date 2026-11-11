import type React from 'react';
import { useEffect, useRef } from 'react';
import { BODY_ROW_HEIGHT_PX } from './constants';
import { type EditorAnchor, type EditorPlacement, useEditorPlacement } from './useEditorPlacement';

/** The overlay's inline style: its placement, and the row height a grid cell editor sizes itself from. */
type EditorOverlayStyle = React.CSSProperties & Record<'--grid-row-height', string>;

const UNPLACED: EditorPlacement = { top: 0, left: 0 };

const overlayStyle = ({ top, left }: EditorPlacement): EditorOverlayStyle => ({
  top,
  left,
  '--grid-row-height': `${BODY_ROW_HEIGHT_PX}px`,
});

const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();

export interface EditorOverlayProps {
  anchor: EditorAnchor;
  container: () => HTMLElement | null;
  ariaLabel: string;
  className: string;
  id?: string;
  dataTestId: string;
  /** A press outside the overlay and its anchor; without it the overlay ignores them. */
  onPressOutside?: () => void;
  /** Mounted once the overlay is placed, so it takes focus where it shows. */
  children: React.ReactNode;
}

/** A popover over the rules at its anchor, keeping its keys and clicks from the view. */
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
      const target = event.target instanceof Node ? event.target : null;
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
      onKeyDown={stopPropagation}
      onClick={stopPropagation}
    >
      {placement && children}
    </fieldset>
  );
};
