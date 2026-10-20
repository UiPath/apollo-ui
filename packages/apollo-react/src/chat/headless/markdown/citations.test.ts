import { describe, expect, it } from 'vitest';

import { type AutopilotChatMessage, AutopilotChatRole } from '../../service';
import { citationFromMarker, getCitationUrl, getGroupCitations } from './citations';

describe('citation helpers', () => {
  it('builds the pre-hook citation from a marker as Material does', () => {
    expect(
      citationFromMarker({ id: 1, title: 'Web', url: 'https://a.test', messageId: 'm' })
    ).toEqual({ id: 1, title: 'Web', url: 'https://a.test' });
    expect(
      citationFromMarker({
        id: 2,
        title: 'Guide',
        download_url: 'https://a.test/g.pdf',
        page_number: 3,
        messageId: 'm',
      })
    ).toEqual({ id: 2, title: 'Guide', download_url: 'https://a.test/g.pdf', page_number: 3 });
  });

  it('opens http(s) and relative URLs, and PDFs at the cited page', () => {
    expect(getCitationUrl({ id: 1, title: 'Web', url: 'https://a.test' })).toBe('https://a.test');
    expect(getCitationUrl({ id: 1, title: 'Web', url: 'http://a.test/page' })).toBe(
      'http://a.test/page'
    );
    expect(
      getCitationUrl({ id: 3, title: 'Local', download_url: '/files/guide.pdf', page_number: 7 })
    ).toBe('/files/guide.pdf#page=7');
    expect(
      getCitationUrl({
        id: 2,
        title: 'Guide',
        download_url: 'https://a.test/g.pdf',
        page_number: 3,
      })
    ).toBe('https://a.test/g.pdf#page=3');
  });

  it('refuses URLs that are not http(s) or relative', () => {
    for (const url of [
      'javascript:alert(1)',
      ' JavaScript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'blob:https://a.test/1',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
    ]) {
      expect(getCitationUrl({ id: 1, title: 'Bad', url })).toBeUndefined();
    }
    expect(
      getCitationUrl({ id: 2, title: 'Bad', download_url: 'javascript:alert(1)', page_number: 1 })
    ).toBeUndefined();
  });

  it('pins how protocol-relative, backslash and look-alike URLs resolve', () => {
    // Protocol-relative and backslash hosts resolve to the page's scheme; an entity-encoded colon
    // is a relative path. All stay on http(s), so they may open.
    for (const url of ['//host.test/a', '\\\\host.test\\a', 'javascript&#58;alert(1)']) {
      expect(getCitationUrl({ id: 1, title: 'Edge', url })).toBe(url);
    }
    // `https:` with no slashes takes "javascript" as the host and "alert(1)" as the port, which
    // does not parse, so it is refused.
    expect(
      getCitationUrl({ id: 1, title: 'Edge', url: 'https:javascript:alert(1)' })
    ).toBeUndefined();
  });

  it('lists the citations of a group once each, in order', () => {
    const message = (citations: Array<{ id: number; title: string; url: string }>) =>
      ({
        id: crypto.randomUUID(),
        role: AutopilotChatRole.Assistant,
        content: '',
        created_at: '',
        widget: 'apollo-markdown-renderer',
        contentParts: [{ text: 'x', citations }],
      }) as AutopilotChatMessage;
    const a = { id: 1, title: 'A', url: 'https://a.test' };
    const b = { id: 2, title: 'B', url: 'https://b.test' };

    expect(getGroupCitations([message([a, b]), message([a])])).toEqual([a, b]);
  });
});
