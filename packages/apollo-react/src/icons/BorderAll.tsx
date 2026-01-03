// Auto-generated from editor/border/border-all.svg
import React from 'react';

export interface BorderAllProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BorderAll = React.forwardRef<SVGSVGElement, BorderAllProps>(
  ({ size, ...props }, ref) => (
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
        d="M3 3V21H21V3H3ZM11 19H5V13H11V19ZM11 11H5V5H11V11ZM19 19H13V13H19V19ZM19 11H13V5H19V11Z"
        fill="currentColor"
      />
    </svg>
  )
);

BorderAll.displayName = 'BorderAll';

export default BorderAll;
