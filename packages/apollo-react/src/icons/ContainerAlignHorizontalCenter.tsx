// Auto-generated from editor/container-align/container-align-horizontal-center.svg
import React from 'react';

export interface ContainerAlignHorizontalCenterProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerAlignHorizontalCenter = React.forwardRef<
  SVGSVGElement,
  ContainerAlignHorizontalCenterProps
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
      d="M11.25 7.5V3H12.75V7.5H18V16.5H12.75V21H11.25V16.5H6V7.5H11.25Z"
      fill="currentColor"
    />
  </svg>
));

ContainerAlignHorizontalCenter.displayName = 'ContainerAlignHorizontalCenter';

export default ContainerAlignHorizontalCenter;
