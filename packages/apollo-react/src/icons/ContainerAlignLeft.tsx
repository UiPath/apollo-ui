// Auto-generated from editor/container-align/container-align-left.svg
import React from 'react';

export interface ContainerAlignLeftProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ContainerAlignLeft = React.forwardRef<SVGSVGElement, ContainerAlignLeftProps>(
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
        d="M4.5 21V3H3V21H4.5ZM19.5 7.5H7.5V16.5H19.5V7.5Z"
        fill="currentColor"
      />
    </svg>
  )
);

ContainerAlignLeft.displayName = 'ContainerAlignLeft';

export default ContainerAlignLeft;
