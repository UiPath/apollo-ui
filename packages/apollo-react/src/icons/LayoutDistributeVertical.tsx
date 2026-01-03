// Auto-generated from editor/layout-distribute/layout-distribute-vertical.svg
import React from 'react';

export interface LayoutDistributeVerticalProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutDistributeVertical = React.forwardRef<
  SVGSVGElement,
  LayoutDistributeVerticalProps
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
      d="M3 4.5L21 4.5L21 3L3 3L3 4.5ZM3 21L21 21L21 19.5L3 19.5L3 21ZM16.5 18L7.5 18L7.5 15L16.5 15L16.5 18ZM7.5 9L16.5 9L16.5 6L7.5 6L7.5 9Z"
      fill="currentColor"
    />
  </svg>
));

LayoutDistributeVertical.displayName = 'LayoutDistributeVertical';

export default LayoutDistributeVertical;
