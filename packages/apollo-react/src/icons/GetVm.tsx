// Auto-generated from studio-icons/get-vm.svg
import React from 'react';

export interface GetVmProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const GetVm = React.forwardRef<SVGSVGElement, GetVmProps>(({ size, ...props }, ref) => (
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
      d="M5 3H4C2.9 3 2 3.9 2 5V16C2 17.1 2.9 18 4 18H11V20H8V22H13V16H4V5H5V3Z"
      fill="currentColor"
    />
    <path d="M19 5H20V13H22V5C22 3.9 21.1 3 20 3H19V5Z" fill="currentColor" />
    <path d="M18 19L16 19L19 22L22 19L20 19L20 15L18 15L18 19Z" fill="#1976D2" />
    <path
      d="M16.1963 5.57715V10.4219L12 12.8447L7.80371 10.4219V5.57715L12 3.1543L16.1963 5.57715Z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
));

GetVm.displayName = 'GetVm';

export default GetVm;
