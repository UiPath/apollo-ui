// Auto-generated from editor/layout-justify/layout-justify-bottom.svg
import React from 'react';

export interface LayoutJustifyBottomProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutJustifyBottom = React.forwardRef<SVGSVGElement, LayoutJustifyBottomProps>(
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
        d="M4.5 10.5L19.5 10.5V7.5H4.5L4.5 10.5ZM4.5 16.5L19.5 16.5V13.5L4.5 13.5L4.5 16.5ZM3 21L21 21V19.5L3 19.5V21Z"
        fill="currentColor"
      />
    </svg>
  )
);

LayoutJustifyBottom.displayName = 'LayoutJustifyBottom';

export default LayoutJustifyBottom;
