// Auto-generated from editor/format-text-direction-l-to-r.svg
import React from 'react';

export interface FormatTextDirectionLToRProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatTextDirectionLToR = React.forwardRef<SVGSVGElement, FormatTextDirectionLToRProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M8 4V8C6.9 8 6 7.1 6 6C6 4.9 6.9 4 8 4ZM16 2H8C5.79 2 4 3.79 4 6C4 8.21 5.79 10 8 10V15H10V4H12V15H14V4H16V2ZM16 14V17H4V19H16V22L20 18L16 14Z" fill="currentColor"/>
    </svg>
  )
);

FormatTextDirectionLToR.displayName = 'FormatTextDirectionLToR';

export default FormatTextDirectionLToR;
