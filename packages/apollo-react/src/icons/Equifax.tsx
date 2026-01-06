// Auto-generated from third-party/equifax.svg
import React from 'react';

export interface EquifaxProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Equifax = React.forwardRef<SVGSVGElement, EquifaxProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.54547 10.6549L4.12091 12.6056H8.66635L8.28338 14.5147H0.00146484L2.03967 5.52283H10.0677L9.68474 7.34732H5.26838L4.92844 8.87346H8.79401L8.41104 10.6549H4.54547ZM16.353 10.6549L22.0015 17.3992H18.2636L15.8008 14.5147C15.8008 14.5147 14.8656 14.8117 13.3796 14.7701C11.8936 14.684 9.13251 14.7701 9.26017 12.1825C9.34479 10.9102 9.76936 9.255 9.76936 9.255C10.5769 6.07362 12.7844 6.07362 15.3762 6.15968C17.1591 6.20127 19.9633 6.20127 19.4526 9.00112C19.4526 9.00112 19.325 9.80722 19.1557 10.6549H16.353ZM14.9517 7.68582C13.678 7.60119 13.2104 8.78883 13.2104 8.78883C12.6581 10.401 12.4459 11.8426 12.4459 11.8426C12.2336 12.9025 13.0397 13.2855 13.7626 13.2855C14.3994 13.2855 15.2486 12.9025 15.5039 12.1825C16.0561 10.6549 16.2684 9.12877 16.2684 9.12877C16.5653 7.43194 14.9517 7.68582 14.9517 7.68582Z" fill="#9E1C33"/>
    </svg>
  )
);

Equifax.displayName = 'Equifax';

export default Equifax;
