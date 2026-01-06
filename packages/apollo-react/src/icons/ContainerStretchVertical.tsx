// Auto-generated from editor/container-stretch/container-stretch-vertical.svg
import React from 'react';

export interface ContainerStretchVerticalProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerStretchVertical = React.forwardRef<SVGSVGElement, ContainerStretchVerticalProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M21 3L3 3V1.5H21V3ZM21 22.5L3 22.5V21H21V22.5ZM7.5 18H16.5L16.5 6L7.5 6L7.5 18Z" fill="currentColor"/>
    </svg>
  )
);

ContainerStretchVertical.displayName = 'ContainerStretchVertical';

export default ContainerStretchVertical;
