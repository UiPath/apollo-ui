// Auto-generated from indicator-and-alert/error-indicator/error-dot.svg
import React from 'react';

export interface ErrorDotProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ErrorDot = React.forwardRef<SVGSVGElement, ErrorDotProps>(
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
      <circle cx="12" cy="12" r="7" fill="#CC3D45" />
    </svg>
  )
);

ErrorDot.displayName = 'ErrorDot';

export default ErrorDot;
