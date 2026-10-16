import { describe, expect, it } from 'vitest';

import { buildHtmlPreviewDocument } from './html-preview';

describe('buildHtmlPreviewDocument', () => {
  it('adds a no-referrer policy before the snippet', () => {
    expect(buildHtmlPreviewDocument('<h1>Hi</h1>')).toBe(
      '<meta name="referrer" content="no-referrer"><h1>Hi</h1>'
    );
  });

  it('keeps a doctype first and adds the CSP when given', () => {
    expect(
      buildHtmlPreviewDocument('<!DOCTYPE html>\n<html></html>', {
        contentSecurityPolicy: "default-src 'none'",
      })
    ).toBe(
      `<!DOCTYPE html><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'">\n<html></html>`
    );
  });
});
