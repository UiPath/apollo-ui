// Auto-generated from editor/layout-align/layout-align-horizontal-right.svg
import React from 'react';

export interface LayoutAlignHorizontalRightProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutAlignHorizontalRight = React.forwardRef<SVGSVGElement, LayoutAlignHorizontalRightProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M19.5 3V21H21V3H19.5ZM18 6.75H3V9.75H18V6.75ZM9 14.25H18V17.25H9V14.25Z" fill="currentColor"/>
    </svg>
  )
);

LayoutAlignHorizontalRight.displayName = 'LayoutAlignHorizontalRight';

export default LayoutAlignHorizontalRight;
