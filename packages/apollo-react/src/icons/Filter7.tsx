// Auto-generated from indicator-and-alert/filter/filter-7.svg
import React from 'react';

export interface Filter7Props extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Filter7 = React.forwardRef<SVGSVGElement, Filter7Props>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7 1H21C22.1 1 23 1.9 23 3V17C23 18.1 22.1 19 21 19H7C5.9 19 5 18.1 5 17V3C5 1.9 5.9 1 7 1ZM1 5H3V21H19V23H3C1.9 23 1 22.1 1 21V5ZM21 17H7V3H21V17ZM17 7L13 15H11L15 7H11V5H17V7Z" fill="currentColor"/>
    </svg>
  )
);

Filter7.displayName = 'Filter7';

export default Filter7;
