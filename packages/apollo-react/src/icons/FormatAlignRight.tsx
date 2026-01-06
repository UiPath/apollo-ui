// Auto-generated from editor/format-align/format-align-right.svg
import React from 'react';

export interface FormatAlignRightProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatAlignRight = React.forwardRef<SVGSVGElement, FormatAlignRightProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M3 21H21V19H3V21ZM9 17H21V15H9V17ZM3 13H21V11H3V13ZM9 9H21V7H9V9ZM3 3V5H21V3H3Z" fill="currentColor"/>
    </svg>
  )
);

FormatAlignRight.displayName = 'FormatAlignRight';

export default FormatAlignRight;
