// Auto-generated from editor/layout-align/layout-align-vertical-top.svg
import React from 'react';

export interface LayoutAlignVerticalTopProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutAlignVerticalTop = React.forwardRef<SVGSVGElement, LayoutAlignVerticalTopProps>(
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 4.5L21 4.5V3H3V4.5ZM6.75 6L6.75 21H9.75L9.75 6L6.75 6ZM14.25 15V6L17.25 6V15H14.25Z"
        fill="currentColor"
      />
    </svg>
  )
);

LayoutAlignVerticalTop.displayName = 'LayoutAlignVerticalTop';

export default LayoutAlignVerticalTop;
