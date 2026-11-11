import { describe, expect, it } from 'vitest';

import { splitFrontmatter } from './frontmatter';

describe('splitFrontmatter', () => {
  it('splits a leading frontmatter block from the body', () => {
    const source = '---\nfriendly_name: Overview\nverified: true\n---\n\n# Overview\n\nText';

    expect(splitFrontmatter(source)).toEqual({
      frontmatter: 'friendly_name: Overview\nverified: true',
      body: '# Overview\n\nText',
    });
  });

  it('reads Windows line endings', () => {
    expect(splitFrontmatter('---\r\na: 1\r\n---\r\nBody')).toEqual({
      frontmatter: 'a: 1',
      body: 'Body',
    });
  });

  it('keeps a file without frontmatter whole', () => {
    expect(splitFrontmatter('# Title\n\n---\n\nAfter a rule')).toEqual({
      frontmatter: null,
      body: '# Title\n\n---\n\nAfter a rule',
    });
  });

  it('keeps an unclosed block as body', () => {
    expect(splitFrontmatter('---\na: 1\n# Title')).toEqual({
      frontmatter: null,
      body: '---\na: 1\n# Title',
    });
  });
});
