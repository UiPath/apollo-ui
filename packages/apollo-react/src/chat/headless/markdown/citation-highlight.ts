import { CHAT_CITATION_START } from '../../service';

// `citationPlugin` leaves a hidden start marker where each cited range begins; the citation
// element ends it. Several ranges can cite the same id, so take the last start before this one.
const getNearestStartMarker = (
  id: number,
  container: Element,
  endEl: Element
): HTMLElement | null => {
  const candidates = Array.from(
    container.querySelectorAll(`.${CHAT_CITATION_START}[data-citation-ids~="${id}"]`)
  ) as HTMLElement[];
  let nearest: HTMLElement | null = null;
  for (const marker of candidates) {
    const rel = marker.compareDocumentPosition(endEl);
    const isBefore =
      !!(rel & Node.DOCUMENT_POSITION_FOLLOWING) || !!(rel & Node.DOCUMENT_POSITION_CONTAINS);
    if (isBefore) {
      nearest = marker;
    }
  }
  return nearest;
};

/**
 * Paints the text a citation supports, from its start marker up to the citation element, inside
 * `container` (the message). Elements in between get a background and bare text nodes are
 * wrapped in spans; anything inside a `[data-citation-sup="true"]` element is left alone.
 *
 * @returns a function that removes the highlight, or `undefined` when there is no start marker
 */
export function highlightCitedRange(
  id: number,
  citation: HTMLElement,
  container: Element,
  color: string
): (() => void) | undefined {
  const startMarker = getNearestStartMarker(id, container, citation);
  if (!startMarker) {
    return undefined;
  }

  const highlightedElements: HTMLElement[] = [];
  const wrappedTextSpans: HTMLElement[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );

  while (walker.nextNode()) {
    if (walker.currentNode === startMarker) {
      break;
    }
  }

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node === citation) {
      break;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el === startMarker || el.closest('[data-citation-sup="true"]')) {
        continue;
      }
      el.style.transition = 'background-color 0.2s';
      el.style.backgroundColor = color;
      highlightedElements.push(el);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      if (
        text.textContent &&
        text.textContent.trim().length > 0 &&
        text.parentElement &&
        !text.parentElement.closest('[data-citation-sup="true"]')
      ) {
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        text.parentElement.insertBefore(span, text);
        span.appendChild(text);
        wrappedTextSpans.push(span);
      }
    }
  }

  return () => {
    for (const el of highlightedElements) {
      el.style.backgroundColor = '';
      el.style.transition = '';
    }
    for (const span of wrappedTextSpans) {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent?.insertBefore(span.firstChild, span);
      }
      parent?.removeChild(span);
    }
  };
}
