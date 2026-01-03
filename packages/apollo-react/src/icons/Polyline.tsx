// Auto-generated from editor/polyline.svg
import React from 'react';

export interface PolylineProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Polyline = React.forwardRef<SVGSVGElement, PolylineProps>(
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
        d="M15 16V17.26L9 14.26V11.09L11.7 8H16V2H10V6.9L7.3 10H3V16H8L15 19.5V22H21V16H15ZM12 4H14V6H12V4ZM7 14H5V12H7V14ZM19 20H17V18H19V20Z"
        fill="currentColor"
      />
    </svg>
  )
);

Polyline.displayName = 'Polyline';

export default Polyline;
