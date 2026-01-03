// Auto-generated from editor/layout-justify/layout-justify-horizontal-center.svg
import React from 'react';

export interface LayoutJustifyHorizontalCenterProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutJustifyHorizontalCenter = React.forwardRef<
  SVGSVGElement,
  LayoutJustifyHorizontalCenterProps
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
      d="M11.25 2.25V20.25H12.75L12.75 2.25H11.25ZM7.5 6.75H4.5L4.5 17.25H7.5L7.5 6.75ZM16.5 6.75H19.5V17.25H16.5V6.75Z"
      fill="currentColor"
    />
  </svg>
));

LayoutJustifyHorizontalCenter.displayName = 'LayoutJustifyHorizontalCenter';

export default LayoutJustifyHorizontalCenter;
