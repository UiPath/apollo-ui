// Auto-generated from editor/container-align/container-align-top.svg
import React from 'react';

export interface ContainerAlignTopProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerAlignTop = React.forwardRef<SVGSVGElement, ContainerAlignTopProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3 4.5L21 4.5V3H3V4.5ZM16.5 19.5L16.5 7.5L7.5 7.5L7.5 19.5H16.5Z" fill="currentColor"/>
    </svg>
  )
);

ContainerAlignTop.displayName = 'ContainerAlignTop';

export default ContainerAlignTop;
