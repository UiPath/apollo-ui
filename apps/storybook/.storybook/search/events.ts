/** Channel events shared by the manager search UI and the preview. */
export const SEARCH_OPEN = 'apollo-search/open';
export const SEARCH_SCROLL_TO = 'apollo-search/scroll-to';

export interface ScrollToPayload {
  /** Storybook entry the target lives on. */
  entryId: string;
  /** Element id, when the heading has one. */
  anchor: string;
  /** Heading text, used when there is no id. */
  heading: string;
  /**
   * Documentation tabs to open first, outermost first, when the match lives in
   * a tab panel (e.g. ["Resources", "Figma"]).
   */
  tabs?: string[];
}
