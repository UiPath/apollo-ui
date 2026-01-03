// Auto-generated from navigation/waffle-outage-waffle-menu.svg
import React from 'react';

export interface WaffleOutageWaffleMenuProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const WaffleOutageWaffleMenu = React.forwardRef<SVGSVGElement, WaffleOutageWaffleMenuProps>(
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
        d="M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 20H20V16H16V20ZM19 0C16.24 0 14 2.24 14 5C14 7.76 16.24 10 19 10C21.76 10 24 7.76 24 5C24 2.24 21.76 0 19 0ZM19.5 8H18.5V7H19.5V8ZM19.5 6H18.5V2H19.5V6ZM16 14H20V11.93C19.67 11.98 19.34 12 19 12C17.93 12 16.91 11.76 16 11.32V14ZM10 4V8H12.68C12.24 7.09 12 6.07 12 5C12 4.66 12.02 4.33 12.07 4H10Z"
        fill="currentColor"
      />
    </svg>
  )
);

WaffleOutageWaffleMenu.displayName = 'WaffleOutageWaffleMenu';

export default WaffleOutageWaffleMenu;
