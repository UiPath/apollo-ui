// Auto-generated from editor/line-axis.svg
import React from 'react';

export interface LineAxisProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LineAxis = React.forwardRef<SVGSVGElement, LineAxisProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M22 7.93L20.59 6.52L16.56 11.05L9.5 4.5L2 12.01L3.5 13.51L9.64 7.36L15.23 12.54L13.5 14.49L9.5 10.49L2 18L3.5 19.5L9.5 13.49L13.5 17.49L16.69 13.9L20.59 17.51L22 16.1L18.02 12.4L22 7.93Z" fill="currentColor"/>
    </svg>
  )
);

LineAxis.displayName = 'LineAxis';

export default LineAxis;
