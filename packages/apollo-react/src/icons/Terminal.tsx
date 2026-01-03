// Auto-generated from object/terminal.svg
import React from 'react';

export interface TerminalProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Terminal = React.forwardRef<SVGSVGElement, TerminalProps>(
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
        d="M20 6H4V18H20V6ZM4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4Z"
        fill="currentColor"
      />
      <path d="M11 14H16V16H11V14Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.58579 12L6.29289 9.70711L7.70711 8.29289L11.4142 12L7.70711 15.7071L6.29289 14.2929L8.58579 12Z"
        fill="currentColor"
      />
    </svg>
  )
);

Terminal.displayName = 'Terminal';

export default Terminal;
