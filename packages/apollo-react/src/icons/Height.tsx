// Auto-generated from editor/height.svg
import React from 'react';

export interface HeightProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Height = React.forwardRef<SVGSVGElement, HeightProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M13 6.99H16L12 3L8 6.99H11V17.01H8L12 21L16 17.01H13V6.99Z" fill="currentColor"/>
    </svg>
  )
);

Height.displayName = 'Height';

export default Height;
