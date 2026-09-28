// Auto-generated from studio-icons/studio-icons-debug.svg
import React from 'react';

export interface StudioIconsDebugProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const StudioIconsDebug = React.forwardRef<SVGSVGElement, StudioIconsDebugProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M7.5 18L17.5 12L7.5 6L7.5 18Z" fill="currentColor"/>
    </svg>
  )
);

StudioIconsDebug.displayName = 'StudioIconsDebug';

export default StudioIconsDebug;
