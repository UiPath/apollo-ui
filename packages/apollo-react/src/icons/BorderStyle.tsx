// Auto-generated from editor/border/border-style.svg
import React from 'react';

export interface BorderStyleProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BorderStyle = React.forwardRef<SVGSVGElement, BorderStyleProps>(
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
        d="M15 21H17V19H15V21ZM19 21H21V19H19V21ZM7 21H9V19H7V21ZM11 21H13V19H11V21ZM19 17H21V15H19V17ZM19 13H21V11H19V13ZM3 3V21H5V5H21V3H3ZM19 9H21V7H19V9Z"
        fill="currentColor"
      />
    </svg>
  )
);

BorderStyle.displayName = 'BorderStyle';

export default BorderStyle;
