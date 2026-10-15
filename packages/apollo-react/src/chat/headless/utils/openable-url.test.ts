import { describe, expect, it } from 'vitest';

import { isOpenableUrl } from './openable-url';

describe('isOpenableUrl', () => {
  it('allows http, https and relative URLs', () => {
    for (const url of ['https://a.test', 'http://a.test/x', '/tasks/1', 'tasks/1', '//a.test']) {
      expect(isOpenableUrl(url)).toBe(true);
    }
  });

  it('refuses every other scheme and unparsable URLs', () => {
    for (const url of [
      'javascript:alert(1)',
      ' JavaScript:alert(1)',
      'data:text/html,x',
      'blob:https://a.test/1',
      'vbscript:x',
      'file:///etc/passwd',
      'https:javascript:alert(1)',
    ]) {
      expect(isOpenableUrl(url)).toBe(false);
    }
  });
});
