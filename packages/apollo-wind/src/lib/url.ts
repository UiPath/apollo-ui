const SAFE_HREF_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Whether an href is safe to render as a link or open. Model or user supplied URLs can carry
 * `javascript:`, `data:` or `vbscript:`; the URL parser lowercases the scheme and strips the
 * whitespace and control characters that defeat substring checks. Relative URLs are allowed.
 */
export function isSafeHref(href: string): boolean {
  try {
    return SAFE_HREF_PROTOCOLS.has(new URL(href, 'https://relative.invalid').protocol);
  } catch {
    return false;
  }
}

/** `href` when it passes {@link isSafeHref}, otherwise `undefined`. */
export function safeHref(href: string | undefined): string | undefined {
  return href && isSafeHref(href) ? href : undefined;
}
