// Auto-generated from editor/align/align-bottom.svg
import React from 'react';

export interface AlignBottomProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlignBottom = React.forwardRef<SVGSVGElement, AlignBottomProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M16 13H13V3H11V13H8L12 17L16 13ZM4 19V21H20V19H4Z" fill="currentColor"/>
    </svg>
  )
);

AlignBottom.displayName = 'AlignBottom';

export default AlignBottom;
