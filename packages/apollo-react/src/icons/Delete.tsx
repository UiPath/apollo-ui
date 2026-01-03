// Auto-generated from action/delete.svg
import React from 'react';

export interface DeleteProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Delete = React.forwardRef<SVGSVGElement, DeleteProps>(({ size, ...props }, ref) => (
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
      d="M14.5 3L15.5 4H19V6H5V4H8.5L9.5 3H14.5ZM6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM8 9H16V19H8V9Z"
      fill="currentColor"
    />
  </svg>
));

Delete.displayName = 'Delete';

export default Delete;
