// Auto-generated from action/filter.svg
import React from 'react';

export interface FilterProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Filter = React.forwardRef<SVGSVGElement, FilterProps>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 24}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 6V8H21V6H3ZM10 18H14V16H10V18ZM18 13H6V11H18V13Z"
      fill="currentColor"
    />
  </svg>
));

Filter.displayName = 'Filter';

export default Filter;
