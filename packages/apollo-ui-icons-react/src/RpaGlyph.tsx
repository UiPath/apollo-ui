// Auto-generated from product-logo/rpa-glyph.svg
import React from 'react';

export interface RpaGlyphProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const RpaGlyph = React.forwardRef<SVGSVGElement, RpaGlyphProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fill="currentColor" fillRule="evenodd" d="M3.818.636c1.243 0 2.277.89 2.5 2.068h1.954c.791 0 1.432.641 1.432 1.432v1.909c0 .79-.64 1.432-1.432 1.432H5.727a.477.477 0 0 0-.477.477v1.909c0 .264.213.477.477.477h1.954a2.546 2.546 0 1 1 0 .955H5.727c-.79 0-1.432-.641-1.432-1.432v-1.91c0-.79.641-1.43 1.432-1.43h2.545a.477.477 0 0 0 .478-.478v-1.91a.477.477 0 0 0-.478-.477H6.318a2.546 2.546 0 1 1-2.5-3.022m6.364 8.59a1.59 1.59 0 1 0 0 3.183 1.59 1.59 0 0 0 0-3.182M3.818 1.59a1.59 1.59 0 1 0 0 3.182 1.59 1.59 0 0 0 0-3.182" clipRule="evenodd"/>
    </svg>
  )
);

RpaGlyph.displayName = 'RpaGlyph';

export default RpaGlyph;
