// Auto-generated from action/compare.svg
import React from 'react';

export interface CompareProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Compare = React.forwardRef<SVGSVGElement, CompareProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M10 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H10V23H12V1H10V3ZM10 18H5L10 12V18ZM14 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H14V12L19 18V5H14V3Z" fill="currentColor"/>
    </svg>
  )
);

Compare.displayName = 'Compare';

export default Compare;
