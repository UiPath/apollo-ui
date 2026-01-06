// Auto-generated from editor/format-align/format-align-left.svg
import React from 'react';

export interface FormatAlignLeftProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatAlignLeft = React.forwardRef<SVGSVGElement, FormatAlignLeftProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M15 15H3V17H15V15ZM15 7H3V9H15V7ZM3 13H21V11H3V13ZM3 21H21V19H3V21ZM3 3V5H21V3H3Z" fill="currentColor"/>
    </svg>
  )
);

FormatAlignLeft.displayName = 'FormatAlignLeft';

export default FormatAlignLeft;
