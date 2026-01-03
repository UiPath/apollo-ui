// Auto-generated from indicator-and-alert/looks/looks-5.svg
import React from 'react';

export interface Looks5Props extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Looks5 = React.forwardRef<SVGSVGElement, Looks5Props>(({ size, ...props }, ref) => (
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
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM15 13V15C15 16.11 14.1 17 13 17H9V15H13V13H9V7H15V9H11V11H13C14.1 11 15 11.89 15 13Z"
      fill="currentColor"
    />
  </svg>
));

Looks5.displayName = 'Looks5';

export default Looks5;
