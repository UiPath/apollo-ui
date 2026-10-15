import React from 'react';

/**
 * Cited-range highlights of one markdown message. The highlighter moves React-owned text nodes
 * into spans, so a highlight must never be on screen while React re-renders that text: none start
 * while the message streams, and any active one is removed before new content renders.
 * Post-parity, the CSS Custom Highlight API (see apollo-wind's citation stories) would paint the
 * range without touching the DOM and make this unnecessary.
 */
export interface CitationHighlights {
  streaming: boolean;
  /** Tracks an active highlight's cleanup; returns a function that forgets it. */
  track: (clear: () => void) => () => void;
}

export const CitationHighlightsContext = React.createContext<CitationHighlights>({
  streaming: false,
  track: () => () => {},
});

/** Owns the highlights of a message whose markdown source is `content`. */
export function useCitationHighlights(content: string, streaming: boolean): CitationHighlights {
  const active = React.useRef(new Set<() => void>());
  const clearAll = React.useCallback(() => {
    for (const clear of active.current) clear();
    active.current.clear();
  }, []);

  // During render, so the DOM is restored before React commits the new content against it.
  const renderedContent = React.useRef(content);
  if (renderedContent.current !== content) {
    renderedContent.current = content;
    clearAll();
  }

  React.useEffect(() => clearAll, [clearAll]);

  return React.useMemo(
    () => ({
      streaming,
      track: (clear) => {
        active.current.add(clear);
        return () => active.current.delete(clear);
      },
    }),
    [streaming]
  );
}
