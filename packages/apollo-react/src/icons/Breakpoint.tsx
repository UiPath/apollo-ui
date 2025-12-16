// Auto-generated from studio-icons/breakpoint.svg
import React from 'react';

export interface BreakpointProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Breakpoint = React.forwardRef<SVGSVGElement, BreakpointProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <circle cx="12" cy="12" r="7" fill="#CC3D45"/>
    </svg>
  )
);

Breakpoint.displayName = 'Breakpoint';

export default Breakpoint;
