// Auto-generated from action/print.svg
import React from 'react';

export interface PrintProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Print = React.forwardRef<SVGSVGElement, PrintProps>(({ size, ...props }, ref) => (
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
      d="M19 8H18V3H6V8H5C3.34 8 2 9.34 2 11V17H6V21H18V17H22V11C22 9.34 20.66 8 19 8ZM8 5H16V8H8V5ZM16 19V17V15H8V19H16ZM18 15V13H6V15H4V11C4 10.45 4.45 10 5 10H19C19.55 10 20 10.45 20 11V15H18ZM17 11.5C17 10.9477 17.4477 10.5 18 10.5C18.5523 10.5 19 10.9477 19 11.5C19 12.0523 18.5523 12.5 18 12.5C17.4477 12.5 17 12.0523 17 11.5Z"
      fill="currentColor"
    />
  </svg>
));

Print.displayName = 'Print';

export default Print;
