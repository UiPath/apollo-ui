// Auto-generated from studio-icons/get-files.svg
import React from 'react';

export interface GetFilesProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const GetFiles = React.forwardRef<SVGSVGElement, GetFilesProps>(
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
        d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H13V20H6V4H13V9H18V14H20V8L14 2Z"
        fill="currentColor"
      />
      <path d="M22 16H15V18H22V16Z" fill="#1976D2" />
      <path d="M19 20H15V22H19V20Z" fill="#1976D2" />
    </svg>
  )
);

GetFiles.displayName = 'GetFiles';

export default GetFiles;
