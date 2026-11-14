import type React from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { BODY_ROW_HEIGHT_PX } from './constants';
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

/** Whether a pointer event landed on the backdrop, which the browser reports on the dialog itself. */
const onBackdrop = (event: React.MouseEvent<HTMLDialogElement>): boolean => {
  const { currentTarget, target, clientX, clientY } = event;
  if (target !== currentTarget) return false;
  const box = currentTarget.getBoundingClientRect();
  return clientX < box.left || clientX > box.right || clientY < box.top || clientY > box.bottom;
};

export interface EditorOverlayProps {
  anchor: EditorAnchor;
  container: RuleWindow['container'];
  ariaLabel: string;
  className: string;
  id?: string;
  dataTestId: string;
  /** A press outside the overlay, which the overlay takes so nothing under it gets that press. */
  onPressOutside: () => void;
  /** Escape, unless a control inside the overlay kept it, or its anchor no longer rendered. */
  onCancel: () => void;
  /** Mounted once the overlay is placed, so it takes focus where it shows. */
  children: React.ReactNode;
}

/** A modal dialog over the rules at its anchor: the page is inert while it shows, a press outside it is its own, and Escape or its anchor no longer rendered cancels it. */
export const EditorOverlay: React.FC<EditorOverlayProps> = ({
  anchor,
  container,
  ariaLabel,
  className,
  id,
  dataTestId,
  onPressOutside,
  onCancel,
  children,
}) => {
  const { overlayRef, placement, hidden } = useEditorPlacement({ container, anchor });
  const pressedOutsideRef = useRef(false);
  const attach = useCallback(
    (dialog: HTMLDialogElement | null) => {
      overlayRef.current = dialog;
      if (dialog?.isConnected && !dialog.open) dialog.showModal();
    },
    [overlayRef]
  );
  useLayoutEffect(() => {
    const dialog = overlayRef.current;
    return () =>
      queueMicrotask(() => {
        if (dialog?.open && !dialog.checkVisibility()) dialog.close();
      });
  }, [overlayRef]);
  const showWhileRendered = (dialog: HTMLDialogElement) => {
    if (hidden && dialog.open) {
      dialog.close();
      onCancel();
    } else if (!hidden && !dialog.open && dialog.isConnected) {
      dialog.showModal();
    }
  };
  useLayoutEffect(() => {
    if (overlayRef.current) showWhileRendered(overlayRef.current);
  });
  const takePress = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (!pressedOutsideRef.current || event.target !== event.currentTarget) return;
    pressedOutsideRef.current = false;
    event.preventDefault();
    onPressOutside();
  };
  return (
    <dialog
      ref={attach}
      id={id}
      aria-label={ariaLabel}
      className={className}
      style={overlayStyle(placement ?? UNPLACED)}
      data-testid={dataTestId}
      onPointerDown={(event) => {
        pressedOutsideRef.current = onBackdrop(event);
        if (pressedOutsideRef.current) event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        pressedOutsideRef.current = false;
      }}
      onMouseDown={(event) => {
        if (onBackdrop(event)) event.preventDefault();
      }}
      onClick={(event) => {
        event.stopPropagation();
        takePress(event);
      }}
      onAuxClick={takePress}
      onContextMenu={takePress}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={(event) => {
        if (overlayRef.current === event.currentTarget) showWhileRendered(event.currentTarget);
      }}
    >
      {placement && children}
    </dialog>
  );
};
