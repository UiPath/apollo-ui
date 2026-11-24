import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { scrollRootsOf } from './renderedTree';
import {
  MARK_TOOLTIP_ANCHOR_CLASS,
  MARK_TOOLTIP_CLASS,
  MARK_TOOLTIP_TEXT_CLASS,
} from './sentenceStyles';
import type { RuleWindow } from './useRuleWindow';

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

const isMarked = (element: HTMLElement | null): element is HTMLElement =>
  element?.isConnected === true && element.matches(MARKED);

const sameShown = (a: ShownMark, b: ShownMark): boolean =>
  a.title === b.title &&
  a.rect.top === b.rect.top &&
  a.rect.left === b.rect.left &&
  a.rect.width === b.rect.width &&
  a.rect.height === b.rect.height;

export interface MarkTooltipProps {
  /** The view whose marks it shows, and where it renders, so it reads in the view's type. */
  container: RuleWindow['container'];
  dataTestId: string;
}

/** One tooltip for the view: the message of the mark the pointer is on, as the host changes it, until Escape, a scroll or the pointer resting off any mark. */
export const MarkTooltip: React.FC<MarkTooltipProps> = ({ container, dataTestId }) => {
  const [shown, setShown] = useState<ShownMark | null>(null);
  const [anchorRoot, setAnchorRoot] = useState<Element | ShadowRoot | null>(null);
  useEffect(() => {
    const section = container();
    if (!section) return;
    const root = section.getRootNode();
    setAnchorRoot(root instanceof ShadowRoot ? root : section.ownerDocument.body);
    let current: HTMLElement | null = null;
    let pointed: Element | null = null;
    let dismissed = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const show = (element: HTMLElement | null) => {
      clearTimeout(hideTimer);
      if (element === current && dismissed) return;
      current = element;
      dismissed = false;
      const title = element?.dataset.markTitle;
      if (!element || !title) {
        setShown(null);
        return;
      }
      const { top, left, width, height } = element.getBoundingClientRect();
      const next = { rect: { top, left, width, height }, title };
      setShown((was) => (was && sameShown(was, next) ? was : next));
    };
    const hide = () => show(null);
    const onPointerOver = (event: PointerEvent) => {
      const marked = markedAt(event.target);
      pointed = event.target instanceof Element ? event.target : null;
      clearTimeout(hideTimer);
      if (marked || !current) show(marked);
      else if (!isOnTooltip(event.target)) hideTimer = setTimeout(hide, HIDE_DELAY_MS);
    };
    const onMarksChange = () => {
      const hovered = pointed?.isConnected ? markedAt(pointed) : null;
      if (hovered) show(hovered);
      else if (isOnTooltip(pointed) && isMarked(current)) show(current);
      else if (current) hide();
    };
    const observer = new MutationObserver(onMarksChange);
    observer.observe(section, {
      subtree: true,
      childList: true,
      characterData: true,
      attributeFilter: ['data-mark-title'],
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      dismissed = true;
      setShown(null);
    };
    const onPointerLeave = () => {
      pointed = null;
      hide();
    };
    section.addEventListener('pointerover', onPointerOver);
    section.addEventListener('pointerleave', onPointerLeave);
    section.addEventListener('keydown', onKeyDown);
    const onScroll = () => {
      pointed = null;
      hide();
    };
    const scrollRoots = scrollRootsOf(section);
    for (const root of scrollRoots) root.addEventListener('scroll', onScroll, true);
    return () => {
      clearTimeout(hideTimer);
      observer.disconnect();
      section.removeEventListener('pointerover', onPointerOver);
      section.removeEventListener('pointerleave', onPointerLeave);
      section.removeEventListener('keydown', onKeyDown);
      for (const root of scrollRoots) root.removeEventListener('scroll', onScroll, true);
    };
  }, [container]);
  const tooltip = (
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
  return anchorRoot ? createPortal(tooltip, anchorRoot) : null;
};
