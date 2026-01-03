// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-move-file.svg
import React from 'react';

export interface Control1MoveFileProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 25
   */
  size?: string | number;
}

export const Control1MoveFile = React.forwardRef<SVGSVGElement, Control1MoveFileProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 25}
      height={size ?? 25}
    >
      <path
        d="M14 18.2354L18.01 18.2354L18.01 15.2354L22 19.2354L18.01 23.2354L18.01 20.2354L14 20.2354L14 18.2354Z"
        fill="#1976D2"
      />
      <path
        d="M14 2.23535H6C4.9 2.23535 4.01 3.13535 4.01 4.23535L4 20.2354C4 21.3354 4.89 22.2354 5.99 22.2354H12V20.2354H6V4.23535H13V9.23535H18V13.2354H20V8.23535L14 2.23535Z"
        fill="currentColor"
      />
    </svg>
  )
);

Control1MoveFile.displayName = 'Control1MoveFile';

export default Control1MoveFile;
