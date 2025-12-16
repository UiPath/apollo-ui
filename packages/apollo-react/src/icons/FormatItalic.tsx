// Auto-generated from editor/format-italic.svg
import React from 'react';

export interface FormatItalicProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatItalic = React.forwardRef<SVGSVGElement, FormatItalicProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M10 5V8H12.21L8.79 16H6V19H14V16H11.79L15.21 8H18V5H10Z" fill="currentColor"/>
    </svg>
  )
);

FormatItalic.displayName = 'FormatItalic';

export default FormatItalic;
