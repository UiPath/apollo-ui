// Auto-generated from editor/layout-align/layout-align-horizontal-center.svg
import React from 'react';

export interface LayoutAlignHorizontalCenterProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutAlignHorizontalCenter = React.forwardRef<SVGSVGElement, LayoutAlignHorizontalCenterProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.25 3V7.5L4.5 7.5L4.5 10.5H11.25L11.25 13.5L7.5 13.5V16.5H11.25L11.25 21H12.75L12.75 16.5H16.5V13.5H12.75V10.5L19.5 10.5V7.5L12.75 7.5V3L11.25 3Z" fill="currentColor"/>
    </svg>
  )
);

LayoutAlignHorizontalCenter.displayName = 'LayoutAlignHorizontalCenter';

export default LayoutAlignHorizontalCenter;
