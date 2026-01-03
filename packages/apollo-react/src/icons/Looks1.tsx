// Auto-generated from indicator-and-alert/looks/looks-1.svg
import React from 'react';

export interface Looks1Props extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Looks1 = React.forwardRef<SVGSVGElement, Looks1Props>(({ size, ...props }, ref) => (
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
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 5V19H5V5H19ZM14 17H12V9H10V7H14V17Z"
      fill="currentColor"
    />
  </svg>
));

Looks1.displayName = 'Looks1';

export default Looks1;
