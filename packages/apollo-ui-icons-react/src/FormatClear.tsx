// Auto-generated from editor/format-clear.svg
import React from 'react';

export interface FormatClearProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatClear = React.forwardRef<SVGSVGElement, FormatClearProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M21 7.06999V4.06999H7.39L10.39 7.06999H12.22L11.67 8.34999L13.76 10.45L15.21 7.06999H21ZM4.41 3.92999L3 5.33999L9.97 12.31L7.5 18.07H10.5L12.07 14.41L17.73 20.07L19.14 18.66L4.41 3.92999Z" fill="currentColor"/>
    </svg>
  )
);

FormatClear.displayName = 'FormatClear';

export default FormatClear;
