// Auto-generated from studio-icons/delete-file-or-folder.svg
import React from 'react';

export interface DeleteFileOrFolderProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DeleteFileOrFolder = React.forwardRef<SVGSVGElement, DeleteFileOrFolderProps>(
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
        d="M8 8H11L17 14V15H15H10V10H8V20H13V22H7.99C6.89 22 6 21.1 6 20L6.01 10C6.01 8.9 6.9 8 8 8Z"
        fill="currentColor"
      />
      <path
        d="M20 4H12L10 2H4C2.89 2 2.01 2.89 2.01 4L2 16C2 17.11 2.89 18 4 18H8V16H4V4H9.17L11.17 6H20V14H22V6C22 4.89 21.11 4 20 4Z"
        fill="currentColor"
      />
      <path
        d="M16.4142 16L15 17.4142L17.4749 19.8891L15.0001 22.364L16.4143 23.7782L18.8891 21.3033L21.364 23.7782L22.7782 22.364L20.3033 19.8891L22.7782 17.4142L21.364 16L18.8891 18.4749L16.4142 16Z"
        fill="#CC3D45"
      />
    </svg>
  )
);

DeleteFileOrFolder.displayName = 'DeleteFileOrFolder';

export default DeleteFileOrFolder;
