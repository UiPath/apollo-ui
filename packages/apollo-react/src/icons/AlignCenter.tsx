// Auto-generated from editor/align/align-center.svg
import React from 'react';

export interface AlignCenterProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlignCenter = React.forwardRef<SVGSVGElement, AlignCenterProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M8 19H11V23H13V19H16L12 15L8 19ZM16 5H13V1H11V5H8L12 9L16 5ZM4 11V13H20V11H4Z" fill="currentColor"/>
    </svg>
  )
);

AlignCenter.displayName = 'AlignCenter';

export default AlignCenter;
