/*
 * The last docs page this tab showed, so the occupant workbench's "Back to
 * docs" returns there. Docs links navigate client-side, so the browser's
 * referrer can't tell; the docs layout records each page as it's shown.
 * Session storage only: per tab, and nothing leaves the browser.
 */

const KEY = "apollo-vertex-last-docs-page";

/** Whether a path is a docs page, not a preview outside the docs layout. */
export const isDocsPath = (path: string) =>
  path.startsWith("/") && !path.startsWith("/preview/");

export function rememberDocsPage(path: string) {
  if (!isDocsPath(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Storage can be blocked; "Back to docs" then goes to its fallback.
  }
}

export function lastDocsPage(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    return path && isDocsPath(path) ? path : null;
  } catch {
    return null;
  }
}
