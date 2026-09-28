// Auto-generated from action/volume-down.svg
import React from 'react';

export interface VolumeDownProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const VolumeDown = React.forwardRef<SVGSVGElement, VolumeDownProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.25 9V15H9.25L14.25 20V4L9.25 9H5.25ZM16.25 7.97V16.02C17.73 15.29 18.75 13.77 18.75 12C18.75 10.23 17.73 8.71 16.25 7.97ZM12.25 15.17V8.83L10.08 11H7.25V13H10.08L12.25 15.17Z" fill="currentColor"/>
    </svg>
  )
);

VolumeDown.displayName = 'VolumeDown';

export default VolumeDown;
