import type { AutopilotChatInfoLink } from '../../service';
import { isOpenableUrl } from './openable-url';

export interface ChatInfoLink {
  label: string;
  /** Absent when the URL may not be linked; the label then shows as plain text. */
  href?: string;
}

/**
 * The host's `infoLinks` as every renderer shows them. An entry without a label is dropped. An
 * empty URL would link to the current page, so it loses its link as a refused one does.
 */
export function normalizeInfoLinks(
  links: readonly AutopilotChatInfoLink[] | null | undefined
): ChatInfoLink[] {
  // Hosts of the web component are not type-checked, so the shape is verified here.
  if (!Array.isArray(links)) {
    return [];
  }

  return links.flatMap((link: Partial<AutopilotChatInfoLink> | null | undefined) => {
    const label = typeof link?.label === 'string' ? link.label.trim() : '';
    if (!label) {
      return [];
    }

    const url = typeof link?.url === 'string' ? link.url.trim() : '';
    return [url && isOpenableUrl(url) ? { label, href: url } : { label }];
  });
}
