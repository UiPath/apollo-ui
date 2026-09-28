// Auto-generated from editor/container-align/container-align-vertical-center.svg
import React from 'react';

export interface ContainerAlignVerticalCenterProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerAlignVerticalCenter = React.forwardRef<SVGSVGElement, ContainerAlignVerticalCenterProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 11.25V6H16.5V11.25L21 11.25V12.75L16.5 12.75V18H7.5V12.75H3V11.25H7.5Z" fill="currentColor"/>
    </svg>
  )
);

ContainerAlignVerticalCenter.displayName = 'ContainerAlignVerticalCenter';

export default ContainerAlignVerticalCenter;
