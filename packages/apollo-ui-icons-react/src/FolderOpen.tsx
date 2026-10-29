// Auto-generated from object/folder-open.svg
import React from 'react';

export interface FolderOpenProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FolderOpen = React.forwardRef<SVGSVGElement, FolderOpenProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 6H20C21.1 6 22 6.9 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18L2.01 6C2.01 4.9 2.9 4 4 4H10L12 6ZM4 8V18H20V8H4Z" fill="currentColor"/>
    </svg>
  )
);

FolderOpen.displayName = 'FolderOpen';

export default FolderOpen;
