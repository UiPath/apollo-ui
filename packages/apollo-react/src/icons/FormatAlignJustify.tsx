// Auto-generated from editor/format-align/format-align-justify.svg
import React from 'react';

export interface FormatAlignJustifyProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatAlignJustify = React.forwardRef<SVGSVGElement, FormatAlignJustifyProps>(
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
        d="M3 21H21V19H3V21ZM3 17H21V15H3V17ZM3 13H21V11H3V13ZM3 9H21V7H3V9ZM3 3V5H21V3H3Z"
        fill="currentColor"
      />
    </svg>
  )
);

FormatAlignJustify.displayName = 'FormatAlignJustify';

export default FormatAlignJustify;
