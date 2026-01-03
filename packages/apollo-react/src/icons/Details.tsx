// Auto-generated from object/details.svg
import React from 'react';

export interface DetailsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Details = React.forwardRef<SVGSVGElement, DetailsProps>(({ size, ...props }, ref) => (
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
      d="M20.1 3H3.9C3.4 3 3 3.4 3 3.9V20.1C3 20.5 3.4 21 3.9 21H20.1C20.5 21 21 20.5 21 20.1V3.9C21 3.4 20.5 3 20.1 3ZM9 7H7V9H9V7ZM17 7H11V9H17V7ZM17 11H11V13H17V11ZM11 15H17V17H11V15ZM7 11H9V13H7V11ZM9 15H7V17H9V15ZM5 19H19V5H5V19Z"
      fill="currentColor"
    />
  </svg>
));

Details.displayName = 'Details';

export default Details;
