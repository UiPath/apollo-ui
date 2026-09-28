// Auto-generated from indicator-and-alert/download-done.svg
import React from 'react';

export interface DownloadDoneProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DownloadDone = React.forwardRef<SVGSVGElement, DownloadDoneProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5 10.7L9.6 15.3L19 6L17 4L9.6 11.4L7 8.8L5 10.7ZM19 18H5V20H19V18Z" fill="currentColor"/>
    </svg>
  )
);

DownloadDone.displayName = 'DownloadDone';

export default DownloadDone;
