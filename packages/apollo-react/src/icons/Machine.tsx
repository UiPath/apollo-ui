// Auto-generated from object/machine.svg
import React from 'react';

export interface MachineProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Machine = React.forwardRef<SVGSVGElement, MachineProps>(({ size, ...props }, ref) => (
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.99 16C21.99 17.1 21.1 18 20 18H24V20H0V18H4C2.9 18 2 17.1 2 16V6C2 4.9 2.9 4 4 4H20C21.1 4 22 4.9 22 6L21.99 16ZM20 6H4V16H20V6Z"
      fill="currentColor"
    />
  </svg>
));

Machine.displayName = 'Machine';

export default Machine;
