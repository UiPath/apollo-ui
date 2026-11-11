import { useCallback, useMemo, useRef } from 'react';
import { FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { SENTENCE_MIN_RULE_HEIGHT_PX, sentenceRuleOffsets } from './sentenceRuleHeights';
import type { SentenceRule } from './sentenceTypes';
import { useVirtualizedAxis } from './useVirtualizedAxis';

const SENTENCE_RULE_OVERSCAN = 10;

/** The window of rules the list mounts, kept on the selected rule, and the scrolls that reveal a rule or a stop. */
export const useRuleWindow = (
  rules: readonly SentenceRule[],
  selectedRowId: string | undefined
) => {
  const listRef = useRef<HTMLUListElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const listStart = useCallback(() => listRef.current?.offsetTop ?? 0, []);
  const headerHeight = useCallback(() => headerRef.current?.offsetHeight ?? 0, []);
  const offsetsPx = useMemo(() => sentenceRuleOffsets(rules), [rules]);
  const selectedRow = useMemo(() => {
    const index = rules.findIndex((rule) => rule.rowId === selectedRowId);
    return index < 0 ? null : index;
  }, [rules, selectedRowId]);
  const { segments, measureRef, scrollItemIntoView } = useVirtualizedAxis(
    rules.length,
    SENTENCE_MIN_RULE_HEIGHT_PX,
    selectedRow,
    {
      axis: 'vertical',
      overscanItems: SENTENCE_RULE_OVERSCAN,
      fallbackViewportPx: FALLBACK_ROW_VIEWPORT_PX,
      leadingFixedPx: listStart,
      stickyLeadingPx: headerHeight,
      itemOffsetsPx: offsetsPx,
    }
  );
  const attachSection = useCallback(
    (element: HTMLElement | null) => {
      sectionRef.current = element;
      measureRef(element);
    },
    [measureRef]
  );
  const container = useCallback(() => sectionRef.current, []);
  const scrollRowIntoView = useCallback(
    (rowIndex: number) => scrollItemIntoView(sectionRef.current, rowIndex),
    [scrollItemIntoView]
  );

  const firstVisibleRow = () => {
    const top = (sectionRef.current?.scrollTop ?? 0) + headerHeight() - listStart();
    const end = offsetsPx.findIndex((offset) => offset > top);
    return end < 0 ? rules.length - 1 : Math.max(0, end - 1);
  };
  const scrollStopIntoView = (rowIndex: number, stop: HTMLElement) => {
    const section = sectionRef.current;
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
