// Auto-generated from studio-activities-icon-sets/backstage/backstage-open-in-desktop.svg
import React from 'react';

export interface BackstageOpenInDesktopProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BackstageOpenInDesktop = React.forwardRef<SVGSVGElement, BackstageOpenInDesktopProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M3 2H21C22.1 2 23 2.9 23 4V8H21V4H3V16H14V20H16V22H8V20H10V18H3C1.9 18 1 17.1 1 16V4C1 2.9 1.9 2 3 2Z" fill="currentColor"/>
<path d="M16 14L20 10L24 14H21V20H19V14H16Z" fill="currentColor"/>
    </svg>
  )
);

BackstageOpenInDesktop.displayName = 'BackstageOpenInDesktop';

export default BackstageOpenInDesktop;
