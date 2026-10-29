// Auto-generated from action/watch.svg
import React from 'react';

export interface WatchProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Watch = React.forwardRef<SVGSVGElement, WatchProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M22.8901 8.59L21.0201 9.69L16.6201 2.1L18.4901 1L22.8901 8.59ZM9.58011 7.49L12.8801 13.21L19.5901 9.36L16.2901 3.64L9.58011 7.49ZM11.3401 12.77L9.14011 8.92L4.41011 11.67L6.61011 15.52L11.3401 12.77ZM1.11011 14.86L2.21011 16.73L5.07011 15.08L3.97011 13.21L1.11011 14.86ZM12.1101 14.2L11.7801 13.76L7.05011 16.51L7.38011 16.95C7.60011 17.28 7.93011 17.61 8.26011 17.83L6.50011 23H8.70011L10.2401 18.27H10.3501L12.0001 23H14.2001L12.1101 16.84C12.6601 16.07 12.6601 15.08 12.1101 14.2Z" fill="currentColor"/>
    </svg>
  )
);

Watch.displayName = 'Watch';

export default Watch;
