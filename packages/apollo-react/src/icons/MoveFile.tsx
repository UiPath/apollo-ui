// Auto-generated from studio-icons/move-file.svg
import React from 'react';

export interface MoveFileProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const MoveFile = React.forwardRef<SVGSVGElement, MoveFileProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M14 18L18.01 18L18.01 15L22 19L18.01 23L18.01 20L14 20L14 18Z" fill="#1976D2"/>
<path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H12V20H6V4H13V9H18V13H20V8L14 2Z" fill="currentColor"/>
    </svg>
  )
);

MoveFile.displayName = 'MoveFile';

export default MoveFile;
