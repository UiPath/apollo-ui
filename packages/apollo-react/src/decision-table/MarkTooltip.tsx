import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import type React from 'react';
import { useEffect, useState } from 'react';
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

/** The mark focus is on, and every message its element is described by. */
interface FocusedMark {
  element: HTMLElement;
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

/** A focused element's own mark, else the marks whose announcements describe it. */
const markedFor = (target: EventTarget | null): HTMLElement[] => {
  const own = markedAt(target);
  if (own || !(target instanceof Element)) return own ? [own] : [];
  const root = target.getRootNode();
  const scope = root instanceof ShadowRoot ? root : document;
  const ids = target.getAttribute('aria-describedby')?.split(' ') ?? [];
  return ids.map((id) => markedAt(scope.getElementById(id))).filter((badge) => badge !== null);
};

const titlesOf = (badges: readonly HTMLElement[]): string =>
  [...new Set(badges.flatMap((badge) => badge.dataset.markTitle?.split('\n') ?? []))].join('\n');

const focusedMarkOf = (target: EventTarget | null): FocusedMark | null => {
  const badges = markedFor(target);
  const [element] = badges;
  return element ? { element, title: titlesOf(badges) } : null;
};

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

/** One tooltip for the view: the message of the mark the pointer is on, else of the one focus is on, as the host changes it, until Escape, a scroll or another element. */
export const MarkTooltip: React.FC<MarkTooltipProps> = ({ container, dataTestId }) => {
  const [shown, setShown] = useState<ShownMark | null>(null);
  useEffect(() => {
    const section = container();
    if (!section) return;
    let current: HTMLElement | null = null;
    let pointed: Element | null = null;
    let hovered: HTMLElement | null = null;
    let focusTarget: Element | null = null;
    let focused: FocusedMark | null = null;
    let dismissed = false;
    let byFocus = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const show = (element: HTMLElement | null, title = element?.dataset.markTitle) => {
      clearTimeout(hideTimer);
      if (element === current && dismissed) return;
      current = element;
      dismissed = false;
      if (!element || !title) {
        setShown(null);
        return;
      }
      const { top, left, width, height } = element.getBoundingClientRect();
      const next = { rect: { top, left, width, height }, title };
      setShown((was) => (was && sameShown(was, next) ? was : next));
    };
    const hide = () => show(null);
    const showFocused = () => {
      byFocus = true;
      show(focused?.element ?? null, focused?.title);
    };
    const onPointerOver = (event: PointerEvent) => {
      const marked = markedAt(event.target);
      pointed = event.target instanceof Element ? event.target : null;
      hovered = marked;
      clearTimeout(hideTimer);
      if (marked) byFocus = false;
      if (marked || !current) show(marked);
      else if (current !== focused?.element && !isOnTooltip(event.target)) {
        hideTimer = setTimeout(showFocused, HIDE_DELAY_MS);
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      focusTarget = event.target instanceof Element ? event.target : null;
      focused = focusedMarkOf(focusTarget);
      if (focused || !hovered) showFocused();
    };
    const onMarksChange = () => {
      hovered = pointed?.isConnected ? markedAt(pointed) : null;
      const was = focused?.element;
      if (focusTarget) focused = focusTarget.isConnected ? focusedMarkOf(focusTarget) : null;
      if (byFocus && focused) showFocused();
      else if (hovered) show(hovered);
      else if (current === null ? focusTarget !== null : current === was || !isMarked(current)) {
        showFocused();
      } else if (isOnTooltip(pointed)) show(current);
    };
    const observer = new MutationObserver(onMarksChange);
    observer.observe(section, {
      subtree: true,
      childList: true,
      characterData: true,
      attributeFilter: ['data-mark-title', 'aria-describedby'],
    });
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && section.contains(event.relatedTarget)) return;
      focusTarget = null;
      focused = null;
      hide();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      focusTarget = null;
      focused = null;
      dismissed = true;
      setShown(null);
    };
    section.addEventListener('pointerover', onPointerOver);
    const onPointerLeave = () => {
      pointed = null;
      hovered = null;
      showFocused();
    };
    section.addEventListener('pointerleave', onPointerLeave);
    section.addEventListener('focusin', onFocusIn);
    section.addEventListener('focusout', onFocusOut);
    section.addEventListener('keydown', onKeyDown);
    const onScroll = () => {
      pointed = null;
      hovered = null;
      focusTarget = null;
      focused = null;
      hide();
    };
    const scrollRoots = scrollRootsOf(section);
    for (const root of scrollRoots) root.addEventListener('scroll', onScroll, true);
    return () => {
      clearTimeout(hideTimer);
      observer.disconnect();
      section.removeEventListener('pointerover', onPointerOver);
      section.removeEventListener('pointerleave', onPointerLeave);
      section.removeEventListener('focusin', onFocusIn);
      section.removeEventListener('focusout', onFocusOut);
      section.removeEventListener('keydown', onKeyDown);
      for (const root of scrollRoots) root.removeEventListener('scroll', onScroll, true);
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
