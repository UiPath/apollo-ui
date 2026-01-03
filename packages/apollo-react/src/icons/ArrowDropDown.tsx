// Auto-generated from navigation/arrow-drop-down.svg
import React from 'react';

export interface ArrowDropDownProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ArrowDropDown = React.forwardRef<SVGSVGElement, ArrowDropDownProps>(
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
      <path d="M7 9.5L12 14.5L17 9.5H7Z" fill="currentColor" />
    </svg>
  )
);

ArrowDropDown.displayName = 'ArrowDropDown';

export default ArrowDropDown;
