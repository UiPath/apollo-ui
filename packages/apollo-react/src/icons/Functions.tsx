// Auto-generated from editor/functions.svg
import React from 'react';

export interface FunctionsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Functions = React.forwardRef<SVGSVGElement, FunctionsProps>(
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
        d="M18 4H7V5.875L12.9583 11.5L7 17.125V19H18V16.1875H11.5833L16.1667 11.5L11.5833 6.8125H18V4Z"
        fill="currentColor"
      />
    </svg>
  )
);

Functions.displayName = 'Functions';

export default Functions;
