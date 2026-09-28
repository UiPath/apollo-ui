// Auto-generated from action/screen-share.svg
import React from 'react';

export interface ScreenShareProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ScreenShare = React.forwardRef<SVGSVGElement, ScreenShareProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M20 18C21.1 18 21.99 17.1 21.99 16L22 6C22 4.89 21.1 4 20 4H4C2.89 4 2 4.89 2 6V16C2 17.1 2.89 18 4 18H0V20H24V18H20ZM4 16V6H20V16.01L4 16ZM7 15C7.56 12.33 9.11 9.67 13 9.13V7L17 10.73L13 14.47V12.28C10.22 12.28 8.39 13.13 7 15Z" fill="currentColor"/>
    </svg>
  )
);

ScreenShare.displayName = 'ScreenShare';

export default ScreenShare;
