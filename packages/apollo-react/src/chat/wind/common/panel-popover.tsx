import { cn, Popover, PopoverAnchor, PopoverContent } from '@uipath/apollo-wind';
import React from 'react';

import {
  AutopilotChatMode,
  CHAT_HISTORY_FULL_SCREEN_WIDTH,
  CHAT_HISTORY_SIDE_BY_SIDE_MAX_HEIGHT,
  CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH,
} from '../../service';

// Material's history popover keeps 16px from the panel's edges.
const PANEL_INSET = 16;

function useElementSize(element: HTMLElement | null) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    if (!element) {
      return;
    }
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return size;
}

/**
 * Material's history popover size: in a panel up to 568 by 441 and 16px in from its sides; in
 * FullScreen 342 wide and as tall as the area below the header.
 */
function popoverSize(mode: AutopilotChatMode, boundary: { width: number; height: number }) {
  if (mode === AutopilotChatMode.FullScreen) {
    return {
      width: Math.min(CHAT_HISTORY_FULL_SCREEN_WIDTH, boundary.width - 2 * PANEL_INSET),
      height: boundary.height - PANEL_INSET,
    };
  }
  return {
    width: Math.min(CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH, boundary.width) - 2 * PANEL_INSET,
    height: CHAT_HISTORY_SIDE_BY_SIDE_MAX_HEIGHT,
  };
}

export interface PanelPopoverProps {
  open: boolean;
  /** The header button it opens from; it anchors there and focus returns there on close. */
  anchor: HTMLElement | null;
  /** The area it stays within: the panel, or the area below the header in FullScreen. */
  boundary: HTMLElement | null;
  mode: AutopilotChatMode;
  label: string;
  onClose: () => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
  'data-slot'?: string;
  children: React.ReactNode;
}

/** A dialog layer other than this popover: a host's confirmation from a pre-hook, say. */
const inOtherDialog = (target: EventTarget | null, popover: Element | null) => {
  const layer =
    target instanceof Element
      ? target.closest('dialog[open], [role="dialog"], [role="alertdialog"]')
      : null;
  return !!layer && layer !== popover && !layer.contains(popover);
};

/**
 * The history's surface: a popover under the header button that opens it, sized as Material's
 * history popover. Focus moves in on open. Escape, a click outside or focus leaving close it;
 * focus returns to the button unless a click put it elsewhere.
 *
 * Not modal: a modal popover makes the rest of the page inert to the pointer and holds focus, so
 * a host's own dialog opened from a pre-hook (to confirm a delete, say) could not be used. Work in
 * such a dialog, and clicks on the opening button (which toggles it), leave it open.
 */
export function PanelPopover({
  open,
  anchor,
  boundary,
  mode,
  label,
  onClose,
  onEscapeKeyDown,
  className,
  children,
  ...props
}: PanelPopoverProps) {
  const boundarySize = useElementSize(boundary);
  const virtualAnchor = React.useMemo(() => ({ current: anchor }), [anchor]);
  const { width, height } = popoverSize(mode, boundarySize);
  const content = React.useRef<HTMLDivElement>(null);
  const closedByPointer = React.useRef(false);

  const keepOpenFor = (event: { target: EventTarget | null; preventDefault: () => void }) => {
    const { target } = event;
    if (
      (target instanceof Node && anchor?.contains(target)) ||
      inOtherDialog(target, content.current)
    ) {
      event.preventDefault();
    }
  };

  return (
    <Popover
      open={open && !!anchor}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      {/* `virtualRef`: the header owns the button, so the popover anchors to it from here. */}
      <PopoverAnchor virtualRef={virtualAnchor as React.RefObject<HTMLElement>} />
      <PopoverContent
        ref={content}
        aria-label={label}
        data-slot={props['data-slot']}
        // From the button's start, held inside the boundary: Material's placement, which lands
        // against the panel's trailing edge.
        align="start"
        collisionBoundary={boundary}
        collisionPadding={PANEL_INSET}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={() => {
          closedByPointer.current = false;
        }}
        onPointerDownOutside={(event) => {
          keepOpenFor(event);
          closedByPointer.current = !event.defaultPrevented;
        }}
        onFocusOutside={keepOpenFor}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (!closedByPointer.current) {
            anchor?.focus();
          }
        }}
        // No open and close animation under reduced motion, as for the settings' slide.
        className={cn('flex flex-col p-0 motion-reduce:animate-none!', className)}
        style={{
          width: width > 0 ? width : undefined,
          height: height > 0 ? height : undefined,
          maxHeight: 'var(--radix-popover-content-available-height)',
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
