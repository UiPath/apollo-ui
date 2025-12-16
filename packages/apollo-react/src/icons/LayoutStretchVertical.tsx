// Auto-generated from editor/layout-stretch/layout-stretch-vertical.svg
import React from 'react';

export interface LayoutStretchVerticalProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutStretchVertical = React.forwardRef<SVGSVGElement, LayoutStretchVerticalProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M21 4.5L3 4.5V3H21V4.5ZM21 21L3 21V19.5H21V21ZM4.5 10.5L19.5 10.5V7.5L4.5 7.5L4.5 10.5ZM4.5 16.5L19.5 16.5V13.5L4.5 13.5L4.5 16.5Z" fill="currentColor"/>
    </svg>
  )
);

LayoutStretchVertical.displayName = 'LayoutStretchVertical';

export default LayoutStretchVertical;
