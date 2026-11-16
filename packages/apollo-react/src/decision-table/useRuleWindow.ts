import type React from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FALLBACK_ROW_VIEWPORT_PX } from './constants';
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

/** Where the rules scroll: in the view's own frame, or in the nearest scrolling ancestor, the view sized to its rules. */
export type DecisionTextScroll = 'self' | 'ancestor';

const SCROLLING_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

const flatParentOf = (node: Node): Node | null => {
  const parent = (node instanceof Element && node.assignedSlot) || node.parentNode;
  return parent instanceof ShadowRoot ? parent.host : parent;
};

/** The nearest ancestor that scrolls vertically, across slots and shadow roots, and the elements on the way to it. */
export const scrollAncestorOf = (
  element: Element
): { scroller: HTMLElement; path: HTMLElement[] } | null => {
  const path: HTMLElement[] = [];
  for (let node = flatParentOf(element); node; node = flatParentOf(node)) {
    if (!(node instanceof HTMLElement)) continue;
    if (SCROLLING_OVERFLOW.has(getComputedStyle(node).overflowY)) return { scroller: node, path };
    path.push(node);
  }
  return null;
};

/** The top of `element` in `scroller`'s scrolled content. */
const contentTopIn = (element: HTMLElement, scroller: HTMLElement): number =>
  element.getBoundingClientRect().top -
  scroller.getBoundingClientRect().top -
  scroller.clientTop +
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

/** The window of rules the list mounts, kept on the retained rule, and the scrolls that reveal a rule or a stop. */
export const useRuleWindow = (
  rules: readonly SentenceRule[],
  selectedRowId: string | undefined,
  retainedRowId: string | undefined,
  scroll: DecisionTextScroll = 'self'
): RuleWindow => {
  const listRef = useRef<HTMLUListElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const ancestorRef = useRef<ReturnType<typeof scrollAncestorOf>>(null);
  const scrollerOf = useCallback(() => ancestorRef.current?.scroller ?? sectionRef.current, []);
  const listStart = useCallback(() => {
    const list = listRef.current;
    const ancestor = ancestorRef.current;
    if (!list) return 0;
    return ancestor ? contentTopIn(list, ancestor.scroller) : list.offsetTop;
  }, []);
  const headerHeight = useCallback(() => {
    const ancestor = ancestorRef.current;
    if (!ancestor) return headerRef.current?.offsetHeight ?? 0;
    return Number.parseFloat(getComputedStyle(ancestor.scroller).scrollPaddingTop) || 0;
  }, []);
  const [listMoves, setListMoves] = useState(0);
  const [measured, setMeasured] = useState<ReadonlyMap<string, number>>(NO_HEIGHTS);
  const offsetsPx = useMemo(() => sentenceRuleOffsets(rules, measured), [rules, measured]);
  const selectedRow = useMemo(() => rowIndexOf(rules, selectedRowId), [rules, selectedRowId]);
  const retainedRow = useMemo(() => rowIndexOf(rules, retainedRowId), [rules, retainedRowId]);
  const { segments, measureRef, scrollItemIntoView } = useVirtualizedAxis(
    rules.length,
    SENTENCE_MIN_RULE_HEIGHT_PX,
    retainedRow,
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
      ancestorRef.current = element && scroll === 'ancestor' ? scrollAncestorOf(element) : null;
      measureRef(ancestorRef.current?.scroller ?? element);
    },
    [measureRef, scroll]
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: the ancestor changes with the scroll mode
  useLayoutEffect(() => {
    const ancestor = ancestorRef.current;
    const section = sectionRef.current;
    if (!ancestor || !section) return;
    let last = listStart();
    const check = () => {
      const next = listStart();
      if (next === last) return;
      last = next;
      setListMoves((count) => count + 1);
    };
    ancestor.scroller.addEventListener('scroll', check, { passive: true });
    if (typeof ResizeObserver === 'undefined') {
      return () => ancestor.scroller.removeEventListener('scroll', check);
    }
    const observer = new ResizeObserver(check);
    for (const element of [section, ...ancestor.path]) {
      observer.observe(element, { box: 'border-box' });
      for (
        let before = element.previousElementSibling;
        before;
        before = before.previousElementSibling
      ) {
        observer.observe(before, { box: 'border-box' });
      }
    }
    return () => {
      ancestor.scroller.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [listStart, scroll]);
  useLayoutEffect(() => {
    if (listMoves > 0) ancestorRef.current?.scroller.dispatchEvent(new Event('scroll'));
  }, [listMoves]);
  const container = useCallback(() => sectionRef.current, []);
  const scrollRowIntoView = useCallback(
    (rowIndex: number) => scrollItemIntoView(scrollerOf(), rowIndex),
    [scrollItemIntoView, scrollerOf]
  );

  const firstVisibleRow = () => {
    const top = (scrollerOf()?.scrollTop ?? 0) + headerHeight() - listStart();
    const end = offsetsPx.findIndex((offset) => offset > top);
    return end < 0 ? rules.length - 1 : Math.max(0, end - 1);
  };
  const scrollStopIntoView = (rowIndex: number, stop: HTMLElement) => {
    const section = scrollerOf();
    if (!section) return;
    const rowHeight = (offsetsPx[rowIndex + 1] ?? 0) - (offsetsPx[rowIndex] ?? 0);
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
