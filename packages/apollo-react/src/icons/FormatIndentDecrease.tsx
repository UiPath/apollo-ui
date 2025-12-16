// Auto-generated from editor/format-indent-decrease.svg
import React from 'react';

export interface FormatIndentDecreaseProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FormatIndentDecrease = React.forwardRef<SVGSVGElement, FormatIndentDecreaseProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M11 17H21V15H11V17ZM3 12L7 16V8L3 12ZM3 21H21V19H3V21ZM3 3V5H21V3H3ZM11 9H21V7H11V9ZM11 13H21V11H11V13Z" fill="currentColor"/>
    </svg>
  )
);

FormatIndentDecrease.displayName = 'FormatIndentDecrease';

export default FormatIndentDecrease;
