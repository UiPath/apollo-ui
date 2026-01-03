// Auto-generated from editor/container-align/container-align-right.svg
import React from 'react';

export interface ContainerAlignRightProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerAlignRight = React.forwardRef<SVGSVGElement, ContainerAlignRightProps>(
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
        d="M19.5 21V3H21V21H19.5ZM4.5 7.5H16.5V16.5H4.5V7.5Z"
        fill="currentColor"
      />
    </svg>
  )
);

ContainerAlignRight.displayName = 'ContainerAlignRight';

export default ContainerAlignRight;
