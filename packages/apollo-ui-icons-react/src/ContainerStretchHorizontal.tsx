// Auto-generated from editor/container-stretch/container-stretch-horizontal.svg
import React from 'react';

export interface ContainerStretchHorizontalProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerStretchHorizontal = React.forwardRef<SVGSVGElement, ContainerStretchHorizontalProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3 3V21H1.5V3H3ZM22.5 3V21H21V3H22.5ZM18 16.5V7.5H6V16.5H18Z" fill="currentColor"/>
    </svg>
  )
);

ContainerStretchHorizontal.displayName = 'ContainerStretchHorizontal';

export default ContainerStretchHorizontal;
