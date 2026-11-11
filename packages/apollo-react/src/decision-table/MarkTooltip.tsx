import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  MARK_TOOLTIP_ANCHOR_CLASS,
  MARK_TOOLTIP_CLASS,
  MARK_TOOLTIP_TEXT_CLASS,
} from './sentenceStyles';

/** The marked element the tooltip shows, in viewport coordinates. */
interface ShownMark {
  rect: Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>;
  title: string;
}

const MARKED = '[data-mark-title]';

const TOOLTIP = '[data-mark-tooltip]';

/** How long the message stays once the pointer is off its mark, so the pointer can cross onto it. */
const HIDE_DELAY_MS = 300;

const isOnTooltip = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(TOOLTIP) !== null;

const markedAt = (target: EventTarget | null): HTMLElement | null =>
  target instanceof Element ? target.closest<HTMLElement>(MARKED) : null;

/** A focused element's own mark, else the mark whose announcement describes it. */
const markedFor = (target: EventTarget | null): HTMLElement | null => {
  const own = markedAt(target);
  if (own || !(target instanceof Element)) return own;
  const root = target.getRootNode();
  const scope = root instanceof ShadowRoot ? root : document;
  const ids = target.getAttribute('aria-describedby')?.split(' ') ?? [];
  for (const id of ids) {
    const badge = markedAt(scope.getElementById(id));
    if (badge) return badge;
  }
  return null;
};

export interface MarkTooltipProps {
  /** The view whose marks it shows, and where it renders, so it reads in the view's type. */
  container: () => HTMLElement | null;
  dataTestId: string;
}

/** One tooltip for the view: the message of the mark the pointer or focus is on, until Escape or another element. */
export const MarkTooltip: React.FC<MarkTooltipProps> = ({ container, dataTestId }) => {
  const [shown, setShown] = useState<ShownMark | null>(null);
  useEffect(() => {
    const section = container();
    if (!section) return;
    let current: HTMLElement | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const show = (element: HTMLElement | null) => {
      clearTimeout(hideTimer);
      if (element === current) return;
      current = element;
      const title = element?.dataset.markTitle;
      if (!element || !title) {
        setShown(null);
        return;
      }
      const { top, left, width, height } = element.getBoundingClientRect();
      setShown({ rect: { top, left, width, height }, title });
    };
    const hide = () => show(null);
    const onPointerOver = (event: PointerEvent) => {
      const marked = markedAt(event.target);
      clearTimeout(hideTimer);
      if (marked || !current) show(marked);
      else if (!isOnTooltip(event.target)) hideTimer = setTimeout(hide, HIDE_DELAY_MS);
    };
    const onFocusIn = (event: FocusEvent) => show(markedFor(event.target));
    const onFocusOut = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node && section.contains(event.relatedTarget))) hide();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShown(null);
    };
    section.addEventListener('pointerover', onPointerOver);
    section.addEventListener('pointerleave', hide);
    section.addEventListener('focusin', onFocusIn);
    section.addEventListener('focusout', onFocusOut);
    section.addEventListener('keydown', onKeyDown);
    section.addEventListener('scroll', hide, true);
    return () => {
      clearTimeout(hideTimer);
      section.removeEventListener('pointerover', onPointerOver);
      section.removeEventListener('pointerleave', hide);
      section.removeEventListener('focusin', onFocusIn);
      section.removeEventListener('focusout', onFocusOut);
      section.removeEventListener('keydown', onKeyDown);
      section.removeEventListener('scroll', hide, true);
    };
  }, [container]);
  return (
    <TooltipProvider>
      <Tooltip open={shown !== null}>
        <TooltipTrigger asChild>
          <span
            aria-hidden
            className={MARK_TOOLTIP_ANCHOR_CLASS}
            style={shown ? shown.rect : { display: 'none' }}
          />
        </TooltipTrigger>
        <TooltipPortal container={container()}>
          <TooltipContent
            side="bottom"
            align="start"
            className={MARK_TOOLTIP_CLASS}
            data-mark-tooltip
            data-testid={`${dataTestId}-mark-tooltip`}
          >
            <div className={MARK_TOOLTIP_TEXT_CLASS}>{shown?.title}</div>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
};
