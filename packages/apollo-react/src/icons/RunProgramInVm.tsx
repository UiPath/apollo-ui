// Auto-generated from studio-icons/run-program-in-vm.svg
import React from 'react';

export interface RunProgramInVmProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const RunProgramInVm = React.forwardRef<SVGSVGElement, RunProgramInVmProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M4 3H20C21.1 3 22 3.9 22 5V15H20V5H4V16H13V22H8V20H11V18H4C2.9 18 2 17.1 2 16V5C2 3.9 2.9 3 4 3Z" fill="currentColor"/>
<path d="M5 6V15H13V13H7V9H17V13L19 14.25V6H5Z" fill="currentColor"/>
<path d="M15 22L22 18L15 14V22Z" fill="#038108"/>
    </svg>
  )
);

RunProgramInVm.displayName = 'RunProgramInVm';

export default RunProgramInVm;
