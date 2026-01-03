// Auto-generated from studio-icons/compress-file.svg
import React from 'react';

export interface CompressFileProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const CompressFile = React.forwardRef<SVGSVGElement, CompressFileProps>(
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
      <path d="M14 18L18.01 18L18.01 15L22 19L18.01 23L18.01 20L14 20L14 18Z" fill="#1976D2" />
      <path
        d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H12V20H6V4H13V9H18V13H20V8L14 2Z"
        fill="currentColor"
      />
      <path d="M10 9H12V11H10V9Z" fill="currentColor" />
      <path d="M12 13V11H14V13H12Z" fill="currentColor" />
      <path d="M12 15H10V13H12V15Z" fill="currentColor" />
      <path d="M12 15H14V17H12V15Z" fill="currentColor" />
    </svg>
  )
);

CompressFile.displayName = 'CompressFile';

export default CompressFile;
