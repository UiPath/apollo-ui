// Auto-generated from editor/container-align/container-align-bottom.svg
import React from 'react';

export interface ContainerAlignBottomProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerAlignBottom = React.forwardRef<SVGSVGElement, ContainerAlignBottomProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.5 4.5L16.5 16.5H7.5L7.5 4.5H16.5ZM3 19.5L21 19.5V21H3V19.5Z"
        fill="currentColor"
      />
    </svg>
  )
);

ContainerAlignBottom.displayName = 'ContainerAlignBottom';

export default ContainerAlignBottom;
