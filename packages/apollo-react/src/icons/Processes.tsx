// Auto-generated from product-logo/processes.svg
import React from 'react';

export interface ProcessesProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Processes = React.forwardRef<SVGSVGElement, ProcessesProps>(
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 2H12.5V12.5H2V2ZM4.33333 4.33333V10.1667H10.1667V4.33333H4.33333ZM14.5417 2.875H21.8333V10.1667H19.5V5.20833H14.5417V2.875ZM17.75 14.8333C16.1392 14.8333 14.8333 16.1392 14.8333 17.75C14.8333 19.3608 16.1392 20.6667 17.75 20.6667C19.3608 20.6667 20.6667 19.3608 20.6667 17.75C20.6667 16.1392 19.3608 14.8333 17.75 14.8333ZM12.5 17.75C12.5 14.8505 14.8505 12.5 17.75 12.5C20.6495 12.5 23 14.8505 23 17.75C23 20.6495 20.6495 23 17.75 23C14.8505 23 12.5 20.6495 12.5 17.75ZM3.16667 14.8333H5.5V19.7917H10.4583V22.125H3.16667V14.8333Z"
        fill="currentColor"
      />
    </svg>
  )
);

Processes.displayName = 'Processes';

export default Processes;
