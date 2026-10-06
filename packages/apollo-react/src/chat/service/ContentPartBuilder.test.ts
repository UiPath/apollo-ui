import { describe, expect, it } from 'vitest';

import type { UrlCitation } from './ChatModel';
import { ContentPartBuilder } from './ContentPartBuilder';

const citation = (title: string, id?: number): UrlCitation =>
  ({ title, url: `https://example.com/${title}`, ...(id !== undefined && { id }) }) as UrlCitation;

describe('ContentPartBuilder', () => {
  it('starts with no parts', () => {
    expect(new ContentPartBuilder().getContentParts()).toEqual([]);
  });

  it('accumulates text chunks for the same index', () => {
    const builder = new ContentPartBuilder();
    builder.addChunk({ index: 0, text: 'Hello' });
    builder.addChunk({ index: 0, text: ', world' });

    expect(builder.getContentParts()).toEqual([{ text: 'Hello, world', citations: [] }]);
  });

  it('returns parts sorted by index regardless of arrival order', () => {
    const builder = new ContentPartBuilder();
    builder.addChunk({ index: 2, text: 'c' });
    builder.addChunk({ index: 0, text: 'a' });
    builder.addChunk({ index: 1, text: 'b' });

    expect(builder.getContentParts().map((part) => part.text)).toEqual(['a', 'b', 'c']);
  });

  it('creates a part for a citation-only chunk', () => {
    const builder = new ContentPartBuilder();
    builder.addChunk({ index: 0, citation: citation('Doc') });

    const [part] = builder.getContentParts();
    expect(part?.text).toBe('');
    expect(part?.citations).toHaveLength(1);
  });

  it('assigns sequential ids to citations without one', () => {
    const builder = new ContentPartBuilder();
    builder.addChunk({ index: 0, citation: citation('First') });
    builder.addChunk({ index: 1, citation: citation('Second') });

    const ids = builder.getContentParts().flatMap((part) => part.citations?.map((c) => c.id));
    expect(ids).toEqual([1, 2]);
  });

  it('reuses the id of an earlier citation with the same title', () => {
    const builder = new ContentPartBuilder();
    builder.addChunk({ index: 0, citation: citation('Doc') });
    builder.addChunk({ index: 1, citation: citation('Other') });
    builder.addChunk({ index: 2, citation: citation('Doc') });

    const ids = builder.getContentParts().flatMap((part) => part.citations?.map((c) => c.id));
    expect(ids).toEqual([1, 2, 1]);
  });

  it('keeps an id the citation already carries', () => {
    const builder = new ContentPartBuilder();
    builder.addChunk({ index: 0, citation: citation('Doc', 42) });
    builder.addChunk({ index: 0, citation: citation('Next') });

    const ids = builder.getContentParts()[0]?.citations?.map((c) => c.id);
    expect(ids).toEqual([42, 1]);
  });
});
