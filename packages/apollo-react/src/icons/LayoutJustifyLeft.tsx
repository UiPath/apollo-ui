// Auto-generated from editor/layout-justify/layout-justify-left.svg
import React from 'react';

export interface LayoutJustifyLeftProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutJustifyLeft = React.forwardRef<SVGSVGElement, LayoutJustifyLeftProps>(
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
        d="M6 3V21H4.5V3H6ZM10.5 6H13.5V18H10.5V6ZM19.5 6H16.5V18H19.5V6Z"
        fill="currentColor"
      />
    </svg>
  )
);

LayoutJustifyLeft.displayName = 'LayoutJustifyLeft';

export default LayoutJustifyLeft;
