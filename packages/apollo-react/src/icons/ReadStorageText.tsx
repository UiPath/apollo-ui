// Auto-generated from studio-icons/read-storage-text.svg
import React from 'react';

export interface ReadStorageTextProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ReadStorageText = React.forwardRef<SVGSVGElement, ReadStorageTextProps>(
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
      <path d="M20 15L20 19.01L23 19.01L19 23L15 19.01L18 19.01L18 15L20 15Z" fill="#1976D2" />
      <path d="M20 2H4V6H6V4H11V19H9V21H13V4H18V6H20V2Z" fill="currentColor" />
    </svg>
  )
);

ReadStorageText.displayName = 'ReadStorageText';

export default ReadStorageText;
