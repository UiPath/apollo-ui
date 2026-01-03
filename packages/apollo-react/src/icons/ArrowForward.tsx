// Auto-generated from navigation/arrow-forward.svg
import React from 'react';

export interface ArrowForwardProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ArrowForward = React.forwardRef<SVGSVGElement, ArrowForwardProps>(
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
        d="M6.11523 20.23L7.88523 22L17.8852 12L7.88523 2L6.11523 3.77L14.3452 12L6.11523 20.23Z"
        fill="currentColor"
      />
    </svg>
  )
);

ArrowForward.displayName = 'ArrowForward';

export default ArrowForward;
