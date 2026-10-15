import type { AutopilotChatMessage, PdfCitation, UrlCitation } from '../../service';

/** The props `citationPlugin` gives each `citation` node. */
export interface CitationMarker {
  id: number;
  title: string;
  url?: string;
  page_number?: number;
  download_url?: string;
  messageId: string;
}

/** The `citation-click` pre-hook's citation for a marker in the text. */
export function citationFromMarker({
  id,
  title,
  url,
  download_url,
  page_number,
}: CitationMarker): UrlCitation | PdfCitation {
  return url
    ? { id, title, url }
    : { id, title, download_url: download_url as string, page_number: page_number as number };
}

const OPENABLE_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Whether a citation URL may be opened. Citations come from the model or the host's backend, so
 * a `javascript:`, `data:`, `blob:` or `vbscript:` URL must not reach `window.open`. The parser
 * lowercases the scheme and drops the whitespace and control characters that defeat a substring
 * check; relative URLs resolve against the page.
 */
export function isOpenableCitationUrl(href: string): boolean {
  try {
    return OPENABLE_PROTOCOLS.has(new URL(href, window.location.href).protocol);
  } catch {
    return false;
  }
}

/**
 * Where a citation opens: its URL, or its PDF at the cited page. `undefined` when there is none
 * or it is not an http(s) or relative URL.
 */
export function getCitationUrl(citation: UrlCitation | PdfCitation): string | undefined {
  let href: string | undefined;
  if ('url' in citation && citation.url) {
    href = citation.url;
  } else if ('download_url' in citation && citation.download_url) {
    href = `${citation.download_url}${citation.page_number ? `#page=${citation.page_number}` : ''}`;
  }
  return href && isOpenableCitationUrl(href) ? href : undefined;
}

/** Every citation in a group's content parts, first occurrence of each id only. */
export function getGroupCitations(group: readonly AutopilotChatMessage[]) {
  const allCitations = group
    .flatMap((message) => message.contentParts?.flatMap((part) => part.citations) ?? [])
    .filter((citation): citation is UrlCitation | PdfCitation => citation !== undefined);

  const seenIds = new Set<number>();
  return allCitations.filter((citation) => {
    if (seenIds.has(citation.id)) {
      return false;
    }
    seenIds.add(citation.id);
    return true;
  });
}
