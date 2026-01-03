// Auto-generated from studio-icons/create-file.svg
import React from 'react';

export interface CreateFileProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const CreateFile = React.forwardRef<SVGSVGElement, CreateFileProps>(
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
      <path d="M20 15H18V18H15V20H18V23H20V20H23V18H20V15Z" fill="#038108" />
    </svg>
  )
);

CreateFile.displayName = 'CreateFile';

export default CreateFile;
