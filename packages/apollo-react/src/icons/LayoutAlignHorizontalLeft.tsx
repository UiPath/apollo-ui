// Auto-generated from editor/layout-align/layout-align-horizontal-left.svg
import React from 'react';

export interface LayoutAlignHorizontalLeftProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutAlignHorizontalLeft = React.forwardRef<SVGSVGElement, LayoutAlignHorizontalLeftProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3V21H3V3H4.5ZM6 6.75H21V9.75H6V6.75ZM15 14.25H6V17.25H15V14.25Z" fill="currentColor"/>
    </svg>
  )
);

LayoutAlignHorizontalLeft.displayName = 'LayoutAlignHorizontalLeft';

export default LayoutAlignHorizontalLeft;
