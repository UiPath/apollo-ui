// Auto-generated from action/export-extract.svg
import React from 'react';

export interface ExportExtractProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ExportExtract = React.forwardRef<SVGSVGElement, ExportExtractProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.41 9.41L11 6.83L11 16.5L13 16.5L13 6.83L15.59 9.41L17 8L12 3L7 8L8.41 9.41ZM19 19V12H21V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V12H5V19H19Z" fill="currentColor"/>
    </svg>
  )
);

ExportExtract.displayName = 'ExportExtract';

export default ExportExtract;
