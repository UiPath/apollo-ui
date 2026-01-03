// Auto-generated from studio-icons/upload-files.svg
import React from 'react';

export interface UploadFilesProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UploadFiles = React.forwardRef<SVGSVGElement, UploadFilesProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path
        d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H13V20H6V4H13V9H18V13H20V8L14 2Z"
        fill="currentColor"
      />
      <path d="M18 23L18 18.99L15 18.99L19 15L23 18.99L20 18.99L20 23L18 23Z" fill="#1976D2" />
    </svg>
  )
);

UploadFiles.displayName = 'UploadFiles';

export default UploadFiles;
