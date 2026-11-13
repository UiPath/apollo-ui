import { useCallback, useMemo, useRef } from 'react';
import { FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { SENTENCE_MIN_RULE_HEIGHT_PX, sentenceRuleOffsets } from './sentenceRuleHeights';
import type { SentenceRule } from './sentenceTypes';
import { useVirtualizedAxis } from './useVirtualizedAxis';

export const SENTENCE_RULE_OVERSCAN = 10;

/** The window of rules the list mounts, measured from the list's offset in the scroll container. */
export const useRuleWindow = (rules: readonly SentenceRule[]) => {
  const listRef = useRef<HTMLUListElement | null>(null);
  const listStart = useCallback(() => listRef.current?.offsetTop ?? 0, []);
  const offsetsPx = useMemo(() => sentenceRuleOffsets(rules), [rules]);
  const { segments, measureRef } = useVirtualizedAxis(
    rules.length,
    SENTENCE_MIN_RULE_HEIGHT_PX,
    null,
    {
      axis: 'vertical',
      overscanItems: SENTENCE_RULE_OVERSCAN,
      fallbackViewportPx: FALLBACK_ROW_VIEWPORT_PX,
      leadingFixedPx: listStart,
      itemOffsetsPx: offsetsPx,
    }
  );
  return { listRef, segments, measureRef };
};
