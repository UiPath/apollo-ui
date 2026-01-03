// Auto-generated from editor/format-align-center.svg
import React from 'react';

export interface FormatAlignCenterProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatAlignCenter = React.forwardRef<SVGSVGElement, FormatAlignCenterProps>(
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
        d="M7 15V17H17V15H7ZM3 21H21V19H3V21ZM3 13H21V11H3V13ZM7 7V9H17V7H7ZM3 3V5H21V3H3Z"
        fill="currentColor"
      />
    </svg>
  )
);

FormatAlignCenter.displayName = 'FormatAlignCenter';

export default FormatAlignCenter;
