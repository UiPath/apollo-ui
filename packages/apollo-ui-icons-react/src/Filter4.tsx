// Auto-generated from indicator-and-alert/filter/filter-4.svg
import React from 'react';

export interface Filter4Props extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Filter4 = React.forwardRef<SVGSVGElement, Filter4Props>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M21 1H7C5.9 1 5 1.9 5 3V17C5 18.1 5.9 19 7 19H21C22.1 19 23 18.1 23 17V3C23 1.9 22.1 1 21 1ZM1 5H3V21H19V23H3C1.9 23 1 22.1 1 21V5ZM17 15H15V11H11V5H13V9H15V5H17V15ZM7 17H21V3H7V17Z" fill="currentColor"/>
    </svg>
  )
);

Filter4.displayName = 'Filter4';

export default Filter4;
