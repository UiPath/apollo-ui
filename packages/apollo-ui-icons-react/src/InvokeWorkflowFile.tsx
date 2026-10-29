// Auto-generated from studio-icons/invoke-workflow-file.svg
import React from 'react';

export interface InvokeWorkflowFileProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const InvokeWorkflowFile = React.forwardRef<SVGSVGElement, InvokeWorkflowFileProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M13 19L13 15L15 15L15 18L19 18L19 15.5L22.5 19L19 22.5L19 20L14 20C13.45 20 13 19.55 13 19Z" fill="#1976D2"/>
<path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H9V20H6V4H13V9H18V13H20V8L14 2Z" fill="currentColor"/>
    </svg>
  )
);

InvokeWorkflowFile.displayName = 'InvokeWorkflowFile';

export default InvokeWorkflowFile;
