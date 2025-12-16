// Auto-generated from editor/layout-align/layout-align-vertical-bottom.svg
import React from 'react';

export interface LayoutAlignVerticalBottomProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutAlignVerticalBottom = React.forwardRef<SVGSVGElement, LayoutAlignVerticalBottomProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.75 18L6.75 3H9.75L9.75 18H6.75ZM3 19.5L21 19.5V21H3V19.5ZM14.25 9V18H17.25V9H14.25Z" fill="currentColor"/>
    </svg>
  )
);

LayoutAlignVerticalBottom.displayName = 'LayoutAlignVerticalBottom';

export default LayoutAlignVerticalBottom;
