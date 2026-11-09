import { describe, expect, it } from 'vitest';
import { isImageIcon } from './useBaseNodePresentation';

describe('isImageIcon', () => {
  it('takes a data URI or an http(s) URL as an image', () => {
    expect(isImageIcon('data:image/png;base64,AAAA')).toBe(true);
    expect(isImageIcon('https://example.com/icon.svg')).toBe(true);
    expect(isImageIcon('HTTP://example.com/icon.png')).toBe(true);
  });

  it('leaves a registered icon name to the icon registry', () => {
    expect(isImageIcon('globe')).toBe(false);
    expect(isImageIcon('data:text/html,<b>x</b>')).toBe(false);
    expect(isImageIcon('javascript:alert(1)')).toBe(false);
  });
});
