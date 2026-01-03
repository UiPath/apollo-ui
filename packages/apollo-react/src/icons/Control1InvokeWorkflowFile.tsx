// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-invoke-workflow-file.svg
import React from 'react';

export interface Control1InvokeWorkflowFileProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 25
   */
  size?: string | number;
}

export const Control1InvokeWorkflowFile = React.forwardRef<
  SVGSVGElement,
  Control1InvokeWorkflowFileProps
>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 25}
    height={size ?? 25}
  >
    <path
      d="M13 19.353L13 15.353L15 15.353L15 18.353L19 18.353L19 15.853L22.5 19.353L19 22.853L19 20.353L14 20.353C13.45 20.353 13 19.903 13 19.353Z"
      fill="#1976D2"
    />
    <path
      d="M14 2.353H6C4.9 2.353 4.01 3.253 4.01 4.353L4 20.353C4 21.453 4.89 22.353 5.99 22.353H9V20.353H6V4.353H13V9.353H18V13.353H20V8.353L14 2.353Z"
      fill="currentColor"
    />
  </svg>
));

Control1InvokeWorkflowFile.displayName = 'Control1InvokeWorkflowFile';

export default Control1InvokeWorkflowFile;
