const OPENABLE_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Whether a URL from the model or a host backend may be opened or linked. A `javascript:`,
 * `data:`, `blob:` or `vbscript:` URL must never reach `window.open` or an `href`. The parser
 * lowercases the scheme and drops the whitespace and control characters that defeat a substring
 * check; relative URLs resolve against the page.
 */
export function isOpenableUrl(href: string): boolean {
  try {
    return OPENABLE_PROTOCOLS.has(new URL(href, window.location.href).protocol);
  } catch {
    return false;
  }
}
