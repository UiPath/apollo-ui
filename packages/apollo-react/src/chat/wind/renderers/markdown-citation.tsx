import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Citation } from '@uipath/apollo-wind';
import React from 'react';

import { useOpenCitation } from '../../headless/hooks/use-citations';
import { highlightCitedRange } from '../../headless/markdown/citation-highlight';
import { type CitationMarker, citationFromMarker } from '../../headless/markdown/citations';
import { CitationHighlightsContext } from './citation-highlights';

/** A `citation` node from `citationPlugin`: a pill that previews, highlights and opens its source. */
export function MarkdownCitation(marker: CitationMarker) {
  const { _ } = useLingui();
  const openCitation = useOpenCitation();
  const ref = React.useRef<HTMLButtonElement>(null);
  const highlights = React.useContext(CitationHighlightsContext);
  const clearHighlight = React.useRef<(() => void) | undefined>(undefined);
  const { id, title, page_number } = marker;
  const page = page_number
    ? _(msg({ id: 'autopilot-chat.message.page-number', message: `Page ${page_number}` }))
    : undefined;
  const pageText = page ? ` (${page})` : '';

  const setActive = (active: boolean) => {
    clearHighlight.current?.();
    clearHighlight.current = undefined;
    const container = ref.current?.closest('[data-chat-message-id]');
    // The preview still shows while streaming; only the range waits for the text to settle.
    if (!active || highlights.streaming || !ref.current || !container) {
      return;
    }
    const clear = highlightCitedRange(
      Number(id),
      ref.current,
      container,
      'var(--color-background-highlight)'
    );
    if (clear) {
      let untrack = () => {};
      const clearOnce = () => {
        untrack();
        clear();
        if (clearHighlight.current === clearOnce) clearHighlight.current = undefined;
      };
      untrack = highlights.track(clearOnce);
      clearHighlight.current = clearOnce;
    }
  };

  return (
    <Citation
      ref={ref}
      // The highlighter skips its own markers by this attribute, as in Material.
      data-citation-sup="true"
      index={id}
      title={title}
      source={page}
      aria-label={_(
        msg({
          id: 'autopilot-chat.message.citation-aria-label',
          message: `Citation ${id}: ${title}${pageText}`,
        })
      )}
      onActiveChange={setActive}
      onSelect={() => openCitation(citationFromMarker(marker))}
    />
  );
}
