// Auto-generated from editor/align/align-top.svg
import React from 'react';

export interface AlignTopProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlignTop = React.forwardRef<SVGSVGElement, AlignTopProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M8 11H11V21H13V11H16L12 7L8 11ZM4 3V5H20V3H4Z" fill="currentColor"/>
    </svg>
  )
);

AlignTop.displayName = 'AlignTop';

export default AlignTop;
