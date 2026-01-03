// Auto-generated from editor/layout-justify/layout-justify-right.svg
import React from 'react';

export interface LayoutJustifyRightProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutJustifyRight = React.forwardRef<SVGSVGElement, LayoutJustifyRightProps>(
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
        d="M18 3V21H19.5V3H18ZM13.5 6H10.5V18H13.5V6ZM4.5 6H7.5V18H4.5V6Z"
        fill="currentColor"
      />
    </svg>
  )
);

LayoutJustifyRight.displayName = 'LayoutJustifyRight';

export default LayoutJustifyRight;
