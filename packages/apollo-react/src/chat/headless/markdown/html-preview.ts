const DOCTYPE = /^\s*<!doctype[^>]*>/i;

/**
 * The document an HTML code block previews in a sandboxed iframe. An `about:srcdoc` frame takes
 * the host page as its referrer, so a `no-referrer` policy keeps the host URL from leaking to
 * anything the snippet loads; an optional Content-Security-Policy narrows what it may load. The
 * tags go after a doctype, if any, so the snippet keeps its rendering mode.
 */
export function buildHtmlPreviewDocument(
  html: string,
  { contentSecurityPolicy }: { contentSecurityPolicy?: string } = {}
) {
  const head = `<meta name="referrer" content="no-referrer">${
    contentSecurityPolicy
      ? `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">`
      : ''
  }`;
  const doctype = html.match(DOCTYPE)?.[0] ?? '';

  return `${doctype}${head}${html.slice(doctype.length)}`;
}
