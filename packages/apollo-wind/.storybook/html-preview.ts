// Story support for HTML previews (outside src, so it never ships). It models the safe setup a
// host should use: the snippet runs in a frame with `sandbox="allow-scripts"` only (an opaque
// origin, never same-origin), sends no referrer, and may load nothing but inline styles, inline
// scripts and images.

export const PREVIEW_SANDBOX = 'allow-scripts';

const PREVIEW_CSP =
  "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'";

const DOCTYPE = /^\s*<!doctype[^>]*>/i;

/** The srcDoc for a preview frame. The policy tags go after a doctype so it keeps its mode. */
export function previewDocument(html: string) {
  const doctype = html.match(DOCTYPE)?.[0] ?? '';
  const head = `<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`;
  return `${doctype}${head}${html.slice(doctype.length)}`;
}
