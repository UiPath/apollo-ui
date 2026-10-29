// Auto-generated from editor/layout-distribute/layout-distribute-horizontal.svg
import React from 'react';

export interface LayoutDistributeHorizontalProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutDistributeHorizontal = React.forwardRef<SVGSVGElement, LayoutDistributeHorizontalProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 21L4.5 3L3 3L3 21H4.5ZM21 21L21 3L19.5 3L19.5 21H21ZM18 7.5L18 16.5H15L15 7.5L18 7.5ZM9 16.5L9 7.5H6L6 16.5H9Z" fill="currentColor"/>
    </svg>
  )
);

LayoutDistributeHorizontal.displayName = 'LayoutDistributeHorizontal';

export default LayoutDistributeHorizontal;
