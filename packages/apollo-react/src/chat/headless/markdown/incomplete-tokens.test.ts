import { describe, expect, it } from 'vitest';

import { extractRenderableContent } from './incomplete-tokens';

describe('extractRenderableContent', () => {
  it('renders everything when no token is open', () => {
    expect(extractRenderableContent('Use [[resource-token:{"id":"a"}]] now')).toEqual({
      renderable: 'Use [[resource-token:{"id":"a"}]] now',
      buffered: '',
    });
  });

  it('holds back an unclosed resource token', () => {
    expect(extractRenderableContent('Use the [[resource-token:{"id":"va')).toEqual({
      renderable: 'Use the ',
      buffered: '[[resource-token:{"id":"va',
    });
  });
});
