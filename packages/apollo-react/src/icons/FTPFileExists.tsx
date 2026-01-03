// Auto-generated from studio-activities-icon-sets/activities-ftp/ftp-file-exists.svg
import React from 'react';

export interface FTPFileExistsProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 25
   */
  size?: string | number;
}

export const FTPFileExists = React.forwardRef<SVGSVGElement, FTPFileExistsProps>(
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
        d="M19.1113 15.2354L19.1113 19.2454L22.1113 19.2454L18.1113 23.2354L14.1113 19.2454L17.1113 19.2454L17.1113 15.2354L19.1113 15.2354Z"
        fill="#1976D2"
      />
      <path
        d="M14.1113 2.23535H6.11133C5.01133 2.23535 4.12133 3.13535 4.12133 4.23535L4.11133 20.2354C4.11133 21.3354 5.00133 22.2354 6.10133 22.2354H12.1113V20.2354H6.11133V4.23535H13.1113V9.23535H18.1113V13.2354H20.1113V8.23535L14.1113 2.23535Z"
        fill="currentColor"
      />
    </svg>
  )
);

FTPFileExists.displayName = 'FTPFileExists';

export default FTPFileExists;
