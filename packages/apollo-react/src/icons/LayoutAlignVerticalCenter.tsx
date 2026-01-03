// Auto-generated from editor/layout-align/layout-align-vertical-center.svg
import React from 'react';

export interface LayoutAlignVerticalCenterProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutAlignVerticalCenter = React.forwardRef<
  SVGSVGElement,
  LayoutAlignVerticalCenterProps
>(({ size, ...props }, ref) => (
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
      d="M7.5 4.5V11.25H3V12.75H7.5V19.5H10.5L10.5 12.75H13.5V16.5H16.5V12.75H21V11.25H16.5V7.5L13.5 7.5V11.25H10.5L10.5 4.5H7.5Z"
      fill="currentColor"
    />
  </svg>
));

LayoutAlignVerticalCenter.displayName = 'LayoutAlignVerticalCenter';

export default LayoutAlignVerticalCenter;
