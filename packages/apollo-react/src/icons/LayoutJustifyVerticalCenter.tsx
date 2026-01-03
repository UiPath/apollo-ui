// Auto-generated from editor/layout-justify/layout-justify-vertical-center.svg
import React from 'react';

export interface LayoutJustifyVerticalCenterProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutJustifyVerticalCenter = React.forwardRef<
  SVGSVGElement,
  LayoutJustifyVerticalCenterProps
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
      d="M3 12.75L21 12.75L21 11.25L3 11.25L3 12.75ZM6.75 16.5L6.75 19.5L17.25 19.5L17.25 16.5L6.75 16.5ZM6.75 7.5L6.75 4.5L17.25 4.5L17.25 7.5L6.75 7.5Z"
      fill="currentColor"
    />
  </svg>
));

LayoutJustifyVerticalCenter.displayName = 'LayoutJustifyVerticalCenter';

export default LayoutJustifyVerticalCenter;
