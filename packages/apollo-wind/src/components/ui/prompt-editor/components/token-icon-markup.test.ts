import { describe, expect, it } from 'vitest';
import { buildTokenIconSvgMarkup } from './token-icon-markup';

describe('buildTokenIconSvgMarkup', () => {
  it('emits a self-contained 14px lucide svg', () => {
    const svg = buildTokenIconSvgMarkup('input');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="14"');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke="currentColor"');
  });

  it('uses a distinct icon class per token type', () => {
    expect(buildTokenIconSvgMarkup('input')).toContain('lucide-variable');
    expect(buildTokenIconSvgMarkup('output')).toContain('lucide-square-function');
    expect(buildTokenIconSvgMarkup('state')).toContain('lucide-database');
    expect(buildTokenIconSvgMarkup('resource')).toContain('lucide-paperclip');
  });

  it('falls back to the input glyph for text tokens', () => {
    expect(buildTokenIconSvgMarkup('text')).toContain('lucide-variable');
  });

  it('renders the ellipse element for the database (state) icon', () => {
    expect(buildTokenIconSvgMarkup('state')).toContain('<ellipse');
  });
});
