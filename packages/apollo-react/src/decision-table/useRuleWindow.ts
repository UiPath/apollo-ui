import type React from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FALLBACK_ROW_VIEWPORT_PX, NEAREST } from './constants';
import { SENTENCE_MIN_RULE_HEIGHT_PX, sentenceRuleOffsets } from './sentenceRuleHeights';
import type { SentenceRule } from './sentenceTypes';
import { type AxisSegment, useVirtualizedAxis } from './useVirtualizedAxis';

export const SENTENCE_RULE_OVERSCAN = 10;

const rowIndexOf = (rules: readonly SentenceRule[], rowId: string | undefined): number | null => {
  const index = rules.findIndex((rule) => rule.rowId === rowId);
  return index < 0 ? null : index;
};

const NO_HEIGHTS: ReadonlyMap<string, number> = new Map();

/** `current` with each resized card's height by its row id; the same map when none changed. */
const measuredHeights = (
  current: ReadonlyMap<string, number>,
  entries: readonly ResizeObserverEntry[]
): ReadonlyMap<string, number> => {
  let next: Map<string, number> | undefined;
  for (const { target } of entries) {
    if (!(target instanceof HTMLElement)) continue;
    const rowId = target.dataset.rowId;
    const height = target.offsetHeight;
    if (rowId === undefined || height === 0 || current.get(rowId) === height) continue;
    next ??= new Map(current);
    next.set(rowId, height);
  }
  return next ?? current;
};

/** Where the rules scroll: in the view's own frame, or in `container`, the page's scrolling element when it is null or omitted, the view sized to its rules. */
export type DecisionTextScroll = 'self' | { container?: HTMLElement | null };

interface ScrollAncestor {
  scroller: HTMLElement;
}

const isPageScroller = (scroller: HTMLElement): boolean =>
  scroller === scroller.ownerDocument.scrollingElement;

/** The container `named`, else the page's scrolling element. */
const scrollAncestorOf = (element: Element, named: HTMLElement | null): ScrollAncestor | null => {
  const scroller = named ?? element.ownerDocument.scrollingElement;
  return scroller instanceof HTMLElement ? { scroller } : null;
};

/** Where `scroller`'s scrolls fire and its content shows: the document for the page's scrolling element. */
const scrollportOf = (scroller: HTMLElement): HTMLElement | Document =>
  isPageScroller(scroller) ? scroller.ownerDocument : scroller;

const pageForwarders = new WeakMap<Document, { views: number; forward: () => void }>();

/** Re-fires the document's scrolls on its scrolling element, once per scroll for every view, until each view stops. */
const forwardPageScrolls = (document: Document): (() => void) => {
  const forwarder = pageForwarders.get(document) ?? {
    views: 0,
    forward: () => document.scrollingElement?.dispatchEvent(new Event('scroll')),
  };
  if (forwarder.views === 0) {
    pageForwarders.set(document, forwarder);
    document.addEventListener('scroll', forwarder.forward, { passive: true });
  }
  forwarder.views += 1;
  return () => {
    forwarder.views -= 1;
    if (forwarder.views > 0) return;
    document.removeEventListener('scroll', forwarder.forward);
    pageForwarders.delete(document);
  };
};

/** The viewport top of `scroller`'s scrollport. */
const scrollportTopOf = (scroller: HTMLElement): number =>
  isPageScroller(scroller) ? 0 : scroller.getBoundingClientRect().top;

/** The top of `element` in `scroller`'s scrolled content. */
export const contentTopIn = (element: HTMLElement, scroller: HTMLElement): number =>
  element.getBoundingClientRect().top -
  scrollportTopOf(scroller) -
  (isPageScroller(scroller) ? 0 : scroller.clientTop) +
  scroller.scrollTop;

export interface RuleWindow {
  listRef: React.RefObject<HTMLUListElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  segments: AxisSegment[];
  /** The index of the selected row, or null when no row in the rules is selected. */
  selectedRow: number | null;
  attachSection: (element: HTMLElement | null) => void;
  /** The view's scroll container. */
  container: () => HTMLElement | null;
  /** Scrolls a row the host selects into view, as the grid's host does for its selected row. */
  scrollRowIntoView: (rowIndex: number) => void;
  /** The first row the sticky header does not cover, where a first key lands. */
  firstVisibleRow: () => number;
  /** Scrolls the row into view when it fits below the sticky header, then the stop within it. */
  scrollStopIntoView: (rowIndex: number, stop: HTMLElement) => void;
}

/** The window of rules the list mounts, kept on the retained rules, and the scrolls that reveal a rule or a stop. */
export const useRuleWindow = (
  rules: readonly SentenceRule[],
  selectedRowId: string | undefined,
  retainedRowIds: readonly (string | undefined)[],
  scroll: DecisionTextScroll = 'self'
): RuleWindow => {
  const named = scroll === 'self' ? undefined : (scroll.container ?? null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const ancestorRef = useRef<ScrollAncestor | null>(null);
  const scrollerOf = useCallback(() => ancestorRef.current?.scroller ?? sectionRef.current, []);
  const listStart = useCallback(() => {
    const list = listRef.current;
    const ancestor = ancestorRef.current;
    if (!list) return 0;
    return ancestor ? contentTopIn(list, ancestor.scroller) : list.offsetTop;
  }, []);
  const headerHeight = useCallback(
    () => (ancestorRef.current ? 0 : (headerRef.current?.offsetHeight ?? 0)),
    []
  );
  const pendingRevealRef = useRef<string | null>(null);
  const [listMoves, setListMoves] = useState(0);
  const [measured, setMeasured] = useState<ReadonlyMap<string, number>>(NO_HEIGHTS);
  const offsetsPx = useMemo(() => sentenceRuleOffsets(rules, measured), [rules, measured]);
  const selectedRow = useMemo(() => rowIndexOf(rules, selectedRowId), [rules, selectedRowId]);
  const retainedRows = useMemo(
    () =>
      retainedRowIds.flatMap((rowId) => {
        const index = rowIndexOf(rules, rowId);
        return index === null ? [] : [index];
      }),
    [rules, retainedRowIds]
  );
  const { segments, measureRef, scrollItemIntoView } = useVirtualizedAxis(
    rules.length,
    SENTENCE_MIN_RULE_HEIGHT_PX,
    retainedRows,
    {
      axis: 'vertical',
      overscanItems: SENTENCE_RULE_OVERSCAN,
      fallbackViewportPx: FALLBACK_ROW_VIEWPORT_PX,
      leadingFixedPx: listStart,
      stickyLeadingPx: headerHeight,
      itemOffsetsPx: offsetsPx,
    }
  );
  const mountedRowIds = segments
    .flatMap((segment) =>
      segment.type === 'items'
        ? rules.slice(segment.from, segment.to).map(({ rowId }) => rowId)
        : []
    )
    .join('\n');
  // biome-ignore lint/correctness/useExhaustiveDependencies: the mounted cards change with their row ids
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) =>
      setMeasured((current) => measuredHeights(current, entries))
    );
    for (const card of list.querySelectorAll(':scope > li[data-row-id]')) observer.observe(card);
    return () => observer.disconnect();
  }, [mountedRowIds]);
  const attachSection = useCallback(
    (element: HTMLElement | null) => {
      sectionRef.current = element;
      ancestorRef.current =
        element && named !== undefined ? scrollAncestorOf(element, named) : null;
      measureRef(ancestorRef.current?.scroller ?? element);
    },
    [measureRef, named]
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: the spacers change with the mounted cards and the ancestor with the named container
  useLayoutEffect(() => {
    const ancestor = ancestorRef.current;
    const list = listRef.current;
    if (!ancestor || !list || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(({ isIntersecting }) => isIntersecting)) {
          setListMoves((count) => count + 1);
        }
      },
      { root: scrollportOf(ancestor.scroller) }
    );
    for (const spacer of list.querySelectorAll(':scope > li:not([data-row-id])')) {
      observer.observe(spacer);
    }
    return () => observer.disconnect();
  }, [mountedRowIds, named]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the ancestor changes with the named container
  useLayoutEffect(() => {
    const ancestor = ancestorRef.current;
    if (!ancestor) return;
    const events = scrollportOf(ancestor.scroller);
    let last = listStart();
    const check = () => {
      const next = listStart();
      if (next === last) return;
      last = next;
      setListMoves((count) => count + 1);
    };
    const stopForwarding = isPageScroller(ancestor.scroller)
      ? forwardPageScrolls(ancestor.scroller.ownerDocument)
      : null;
    events.addEventListener('scroll', check, { passive: true });
    return () => {
      events.removeEventListener('scroll', check);
      stopForwarding?.();
    };
  }, [listStart, named]);
  useLayoutEffect(() => {
    if (listMoves > 0) ancestorRef.current?.scroller.dispatchEvent(new Event('scroll'));
  }, [listMoves]);
  const container = useCallback(() => sectionRef.current, []);
  const cardOf = useCallback(
    (rowId: string) =>
      listRef.current?.querySelector<HTMLElement>(
        `:scope > li[data-row-id="${CSS.escape(rowId)}"]`
      ) ?? null,
    []
  );
  const scrollRowIntoView = useCallback(
    (rowIndex: number) => {
      scrollItemIntoView(scrollerOf(), rowIndex);
      const rowId = ancestorRef.current ? rules[rowIndex]?.rowId : undefined;
      if (rowId === undefined) return;
      const card = cardOf(rowId);
      pendingRevealRef.current = card ? null : rowId;
      card?.scrollIntoView?.(NEAREST);
    },
    [scrollItemIntoView, scrollerOf, rules, cardOf]
  );
  useLayoutEffect(() => {
    const pending = pendingRevealRef.current;
    const card = pending === null ? null : cardOf(pending);
    if (!card) return;
    pendingRevealRef.current = null;
    card.scrollIntoView?.(NEAREST);
  });

  const firstVisibleRow = () => {
    const top = (scrollerOf()?.scrollTop ?? 0) + headerHeight() - listStart();
    const end = offsetsPx.findIndex((offset) => offset > top);
    return end < 0 ? rules.length - 1 : Math.max(0, end - 1);
  };
  const scrollStopIntoView = (rowIndex: number, stop: HTMLElement) => {
    const ancestor = ancestorRef.current;
    const rowHeight = (offsetsPx[rowIndex + 1] ?? 0) - (offsetsPx[rowIndex] ?? 0);
    if (ancestor) {
      if (rowHeight <= (ancestor.scroller.clientHeight || FALLBACK_ROW_VIEWPORT_PX)) {
        scrollRowIntoView(rowIndex);
      }
      stop.scrollIntoView?.(NEAREST);
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    if (rowHeight <= (section.clientHeight || FALLBACK_ROW_VIEWPORT_PX) - headerHeight()) {
      scrollRowIntoView(rowIndex);
    }
    const top = section.getBoundingClientRect().top + headerHeight();
    const bottom = section.getBoundingClientRect().top + section.clientHeight;
    const { top: stopTop, bottom: stopBottom } = stop.getBoundingClientRect();
    if (stopTop < top || stopBottom - stopTop > bottom - top) {
      section.scrollTop -= top - stopTop;
    } else if (stopBottom > bottom) {
      section.scrollTop += stopBottom - bottom;
    }
  };

  return {
    listRef,
    headerRef,
    segments,
    selectedRow,
    attachSection,
    container,
    scrollRowIntoView,
    firstVisibleRow,
    scrollStopIntoView,
  };
};
