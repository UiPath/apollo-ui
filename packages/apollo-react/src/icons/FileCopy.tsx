// Auto-generated from object/file-copy.svg
import React from 'react';

export interface FileCopyProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FileCopy = React.forwardRef<SVGSVGElement, FileCopyProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M16.5 1H4.5C3.4 1 2.5 1.9 2.5 3V17H4.5V3H16.5V1ZM15.5 5H8.5C7.4 5 6.51 5.9 6.51 7L6.5 21C6.5 22.1 7.39 23 8.49 23H19.5C20.6 23 21.5 22.1 21.5 21V11L15.5 5ZM8.5 7V21H19.5V12H14.5V7H8.5Z" fill="currentColor"/>
    </svg>
  )
);

FileCopy.displayName = 'FileCopy';

export default FileCopy;
