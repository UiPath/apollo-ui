import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { describe, expect, it } from 'vitest';

import type { ContentPart, PdfCitation } from '../../service';
import { citationPlugin, contentPartsToMarkdown } from './citation-parser';

const citation: PdfCitation = {
  id: 1,
  title: '16-WRC Services-V3.docx',
  download_url: '/org/tenant/ecs_/v1.1/reference/abc=',
  page_number: 15,
};

const cited = (text: string): ContentPart => ({ text, citations: [citation] });

/** Renders content parts through the same remark plugins as the chat markdown renderers. */
const render = (parts: ContentPart[]) =>
  renderToStaticMarkup(
    createElement(
      ReactMarkdown,
      {
        remarkPlugins: [citationPlugin, remarkGfm],
        components: {
          citation: ({ id }: { id: number }) => createElement('sup', null, `[${id}]`),
        } as never,
      },
      contentPartsToMarkdown('m1', parts)
    )
  );

const CITATION_START =
  '<span class="citation-start" data-citation-ids="1" style="display:none"></span>';

describe('contentPartsToMarkdown', () => {
  it('wraps cited text in citation markers', () => {
    expect(contentPartsToMarkdown('m1', [{ text: 'Plain ' }, cited('cited')])).toMatch(
      /^Plain \[\[cite-start:[^\]]+\]\]cited\[\[cite-end\]\]$/
    );
  });

  it('does not separate markers that no URL touches', () => {
    const markdown = contentPartsToMarkdown('m1', [{ text: 'Plain.' }, cited('cited.')]);
    expect(markdown).toMatch(/^Plain\.\[\[cite-start:/);
    expect(markdown).toMatch(/cited\.\[\[cite-end\]\]$/);
  });

  it('separates [[cite-start]] from a URL ending the previous part with a tab and flags it', () => {
    expect(contentPartsToMarkdown('m1', [{ text: 'See www.example.com.' }, cited('')])).toMatch(
      /^See www\.example\.com\.\t\[\[cite-start\+:/
    );
  });

  it('separates [[cite-end]] from a www. URL ending the cited text with a tab and flags it', () => {
    expect(contentPartsToMarkdown('m1', [cited('See www.example.com')])).toMatch(
      /See www\.example\.com\t\[\[cite-end\+\]\]$/
    );
  });

  it('does not separate a marker from a trailing backslash that escapes it', () => {
    expect(contentPartsToMarkdown('m1', [{ text: 'See www.example.com\\' }, cited('')])).toMatch(
      /www\.example\.com\\\[\[cite-start:/
    );
    expect(contentPartsToMarkdown('m1', [cited('See www.example.com\\')])).toMatch(
      /www\.example\.com\\\[\[cite-end\]\]$/
    );
  });

  it('still separates a marker from an escaped backslash', () => {
    expect(contentPartsToMarkdown('m1', [{ text: 'See www.example.com\\\\' }, cited('')])).toMatch(
      /www\.example\.com\\\\\t\[\[cite-start\+:/
    );
  });

  it('does not flag a marker after a tab the author wrote', () => {
    expect(contentPartsToMarkdown('m1', [{ text: 'Hello\t' }, cited('world')])).toMatch(
      /^Hello\t\[\[cite-start:/
    );
    expect(contentPartsToMarkdown('m1', [cited('Hello\tworld\t')])).toMatch(
      /world\t\[\[cite-end\]\]$/
    );
  });

  it('keeps the space before [[cite-end]] after an http(s) URL ending the cited text', () => {
    expect(contentPartsToMarkdown('m1', [cited('See https://example.com')])).toMatch(
      /See https:\/\/example\.com \[\[cite-end\]\]$/
    );
  });
});

/**
 * How many times longer converting 4x as many parts takes: about 4 when the conversion is linear,
 * about 16 when it is quadratic. A ratio rather than a time budget, so slow CI machines still pass.
 */
const growth = (makeParts: (count: number) => ContentPart[], count: number) => {
  const time = (parts: ContentPart[]) => {
    let best = Number.POSITIVE_INFINITY;
    for (let run = 0; run < 3; run++) {
      const started = performance.now();
      contentPartsToMarkdown('m1', parts);
      best = Math.min(best, performance.now() - started);
    }
    return best;
  };
  const small = makeParts(count);
  const large = makeParts(count * 4);
  time(small); // Warm up
  return time(large) / time(small);
};

describe('contentPartsToMarkdown performance', () => {
  it('stays linear for many cited parts with no whitespace between them', () => {
    // Chinese or Japanese text has no spaces, so the last word can be the whole message
    const parts = (count: number) =>
      Array.from({ length: count }, () =>
        cited('労働者は監督官による職場の検査を求めることができます。')
      );
    expect(growth(parts, 1000)).toBeLessThan(10);
  });

  it('stays linear for many cited parts that each follow a URL', () => {
    const parts = (count: number) =>
      Array.from({ length: count }, () => [{ text: 'See www.example.com.' }, cited('')]).flat();
    expect(growth(parts, 1000)).toBeLessThan(10);
  });

  it('finds a URL split across parts with no whitespace between them', () => {
    expect(
      contentPartsToMarkdown('m1', [{ text: 'see htt' }, { text: 'ps://x.io' }, cited('')])
    ).toMatch(/x\.io\t\[\[cite-start\+:/);
  });
});

describe('citation rendering with GFM autolinks', () => {
  it.each([
    [
      'bold www. URL before an empty cited part',
      [
        {
          text: 'Complete the complaint form on the WRC website at **www.workplacerelations.ie**.',
        },
        cited(''),
      ],
    ],
    ['bare www. URL before an empty cited part', [{ text: 'See www.example.com.' }, cited('')]],
    ['bare https URL before an empty cited part', [{ text: 'See https://example.com' }, cited('')]],
    ['cited text ending in a www. URL', [cited('See www.example.com')]],
    ['cited text ending in an https URL', [cited('See https://example.com')]],
    [
      'uppercase HTTPS URL before an empty cited part',
      [{ text: 'See HTTPS://example.com' }, cited('')],
    ],
    [
      'uppercase WWW. URL before an empty cited part',
      [{ text: 'See WWW.example.com.' }, cited('')],
    ],
    ['cited text ending in a mixed-case Www. URL', [cited('See Www.example.com')]],
  ])('renders the citation and no raw marker or tab: %s', (_name, parts) => {
    const html = render(parts);

    expect(html).not.toMatch(/cite-start|cite-end/);
    expect(html).not.toContain('\t');
    expect(html).toContain('<sup>[1]</sup>');
  });

  it('keeps the bold URL intact with no space before the citation', () => {
    expect(
      render([{ text: 'Complete the form at **www.workplacerelations.ie**.' }, cited('')])
    ).toContain(
      `<strong><a href="http://www.workplacerelations.ie">www.workplacerelations.ie</a></strong>.${CITATION_START}<sup>[1]</sup>`
    );
  });

  it.each([
    [
      'before a cited part',
      [{ text: 'Hello\t' }, cited('world')],
      `<p>Hello\t${CITATION_START}world<sup>[1]</sup></p>`,
    ],
    [
      'at the end of cited text',
      [cited('Hello\tworld\t'), { text: 'next' }],
      `<p>${CITATION_START}Hello\tworld\t<sup>[1]</sup>next</p>`,
    ],
    [
      'as the whole cited text',
      [cited('a'), cited('\t')],
      `<p>${CITATION_START}a<sup>[1]</sup>${CITATION_START}\t<sup>[1]</sup></p>`,
    ],
    [
      'as &#9; before a cited part',
      [{ text: 'Hello&#9;' }, cited('world')],
      `<p>Hello\t${CITATION_START}world<sup>[1]</sup></p>`,
    ],
    [
      'as &#x09; before a cited part',
      [{ text: 'Hello&#x09;' }, cited('world')],
      `<p>Hello\t${CITATION_START}world<sup>[1]</sup></p>`,
    ],
    [
      'as &Tab; before a cited part',
      [{ text: 'Hello&Tab;' }, cited('world')],
      `<p>Hello\t${CITATION_START}world<sup>[1]</sup></p>`,
    ],
    [
      'as &#9; at the end of cited text',
      [cited('Hello&#9;'), { text: 'world' }],
      `<p>${CITATION_START}Hello\t<sup>[1]</sup>world</p>`,
    ],
    [
      'as &#x09; at the end of cited text',
      [cited('Hello&#x09;'), { text: 'world' }],
      `<p>${CITATION_START}Hello\t<sup>[1]</sup>world</p>`,
    ],
    [
      'as &Tab; at the end of cited text',
      [cited('Hello&Tab;'), { text: 'world' }],
      `<p>${CITATION_START}Hello\t<sup>[1]</sup>world</p>`,
    ],
    [
      'after a list marker',
      [{ text: '-\t' }, cited('world')],
      `<ul>\n<li>${CITATION_START}world<sup>[1]</sup></li>\n</ul>`,
    ],
    [
      'after an ordered list marker',
      [{ text: '1.\t' }, cited('world')],
      `<ol>\n<li>${CITATION_START}world<sup>[1]</sup></li>\n</ol>`,
    ],
    [
      'after a blockquote marker',
      [{ text: '>\t' }, cited('world')],
      `<blockquote>\n<p>${CITATION_START}world<sup>[1]</sup></p>\n</blockquote>`,
    ],
    [
      'indenting a line in a list item',
      [{ text: '- a\n\n\t' }, cited('more')],
      `<ul>\n<li>\n<p>a</p>\n<p>${CITATION_START}more<sup>[1]</sup></p>\n</li>\n</ul>`,
    ],
  ])('renders a tab the author wrote %s as it does without the fix', (_name, parts, expected) => {
    expect(render(parts)).toBe(expected);
  });

  it.each([
    [
      'a markdown link',
      [{ text: 'See [Docs](https://example.com)' }, cited('.')],
      `<a href="https://example.com">Docs</a>${CITATION_START}.<sup>[1]</sup>`,
    ],
    [
      'an angle-bracket link',
      [{ text: 'See <https://example.com>' }, cited('.')],
      `<a href="https://example.com">https://example.com</a>${CITATION_START}.<sup>[1]</sup>`,
    ],
    [
      'inline code',
      [{ text: 'Run `www.example.com`' }, cited('.')],
      `<code>www.example.com</code>${CITATION_START}.<sup>[1]</sup>`,
    ],
  ])('adds no space after a URL that is not autolinked: %s', (_name, parts, expected) => {
    expect(render(parts)).toContain(expected);
  });

  it.each([
    [
      'before a cited part',
      [{ text: 'See [Docs](https://example.com)\\' }, cited('.')],
      `<a href="https://example.com">Docs</a>${CITATION_START}.<sup>[1]</sup>`,
    ],
    [
      'at the end of cited text',
      [cited('See [Docs](//www.example.com)\\'), { text: ' more' }],
      `<a href="//www.example.com">Docs</a><sup>[1]</sup> more`,
    ],
  ])('shows no stray backslash from a trailing escape %s', (_name, parts, expected) => {
    expect(render(parts)).toContain(expected);
  });

  it('keeps bold that opens right before a cited range', () => {
    expect(render([{ text: 'Invoices need **' }, cited('finance approval**')])).toContain(
      `<strong>${CITATION_START}finance approval</strong>`
    );
  });

  it.each([
    [
      'a markdown link',
      [{ text: 'See the [policy](https://example.com/policy)**' }, cited('confidential**')],
      `<a href="https://example.com/policy">policy</a><strong>${CITATION_START}confidential</strong>`,
    ],
    [
      'an angle-bracket link',
      [{ text: 'See <https://example.com>**' }, cited('confidential**')],
      `<a href="https://example.com">https://example.com</a><strong>${CITATION_START}confidential</strong>`,
    ],
    [
      'inline code',
      [{ text: 'Run `www.example.com`**' }, cited('then restart**')],
      `<code>www.example.com</code><strong>${CITATION_START}then restart</strong>`,
    ],
    [
      'inline code containing a space',
      [{ text: 'Run `curl https://example.com`**' }, cited('important**')],
      `<code>curl https://example.com</code><strong>${CITATION_START}important</strong>`,
    ],
    [
      'a markdown link with nested parentheses',
      [{ text: '[Docs](https://example.com/a_(b_(c)))**' }, cited('important**')],
      `<a href="https://example.com/a_(b_(c))">Docs</a><strong>${CITATION_START}important</strong>`,
    ],
    [
      'italics closing after a link',
      [{ text: '_[Docs](https://example.com)a_**' }, cited('important**')],
      `<em><a href="https://example.com">Docs</a>a</em><strong>${CITATION_START}important</strong>`,
    ],
    [
      'an italic URL',
      [{ text: '_see www.example.com_**' }, cited('important**')],
      `<em>see <a href="http://www.example.com">www.example.com</a></em><strong>${CITATION_START}important</strong>`,
    ],
    [
      'a struck-through link',
      [{ text: '~~[Docs](https://example.com)~~**' }, cited('important**')],
      `<del><a href="https://example.com">Docs</a></del><strong>${CITATION_START}important</strong>`,
    ],
  ])('keeps bold that opens right after %s before a cited range', (_name, parts, expected) => {
    expect(render(parts)).toContain(expected);
  });

  it.each([
    ['bold, no period', 'Visit **www.workplacerelations.ie**', '<strong>'],
    ['italic', 'Visit _www.workplacerelations.ie_', '<em>'],
    [
      'bold with a trailing slash and a period',
      'Visit **https://www.workplacerelations.ie/**.',
      '<strong>',
    ],
  ])('renders a %s URL before a citation', (_name, text, emphasis) => {
    const html = render([{ text }, cited('')]);

    expect(html).not.toMatch(/cite-start|cite-end/);
    expect(html).toContain(emphasis);
    expect(html).toContain('<sup>[1]</sup>');
  });
});
