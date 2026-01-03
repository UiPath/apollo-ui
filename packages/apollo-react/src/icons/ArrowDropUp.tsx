// Auto-generated from navigation/arrow-drop-up.svg
import React from 'react';

export interface ArrowDropUpProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ArrowDropUp = React.forwardRef<SVGSVGElement, ArrowDropUpProps>(
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
      <path d="M7 14.5L12 9.5L17 14.5H7Z" fill="currentColor" />
    </svg>
  )
);

ArrowDropUp.displayName = 'ArrowDropUp';

export default ArrowDropUp;
