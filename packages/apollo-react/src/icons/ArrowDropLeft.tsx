// Auto-generated from navigation/arrow-drop-left.svg
import React from 'react';

export interface ArrowDropLeftProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ArrowDropLeft = React.forwardRef<SVGSVGElement, ArrowDropLeftProps>(
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
      <path d="M14.5 7L9.5 12L14.5 17V7Z" fill="currentColor" />
    </svg>
  )
);

ArrowDropLeft.displayName = 'ArrowDropLeft';

export default ArrowDropLeft;
