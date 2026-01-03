// Auto-generated from studio-activities-icon-sets/activities-control-2/control-2-switch.svg
import React from 'react';

export interface Control2SwitchProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control2Switch = React.forwardRef<SVGSVGElement, Control2SwitchProps>(
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
      <g clipPath="url(#clip0_4117_1603)">
        <path
          d="M10 22H4C3.44772 22 3 21.5523 3 21L3 16C3 15.4477 3.44772 15 4 15H6V9H4C3.44772 9 3 8.55228 3 8L3 3C3 2.44772 3.44772 2 4 2L10 2C10.5523 2 11 2.44772 11 3L11 8C11 8.55228 10.5523 9 10 9H8L8 11H17C17.5523 11 18 11.4477 18 12V15H20C20.5523 15 21 15.4477 21 16V21C21 21.5523 20.5523 22 20 22H14C13.4477 22 13 21.5523 13 21L13 16C13 15.4477 13.4477 15 14 15H16V13H8L8 15H10C10.5523 15 11 15.4477 11 16L11 21C11 21.5523 10.5523 22 10 22Z"
          fill="currentColor"
        />
        <path d="M9 4H5V7H9V4Z" fill="var(--color-foreground)" />
        <path d="M9 17H5V20H9V17Z" fill="currentColor" />
        <path d="M19 17H15V20H19V17Z" fill="var(--color-foreground)" />
      </g>
      <defs>
        <clipPath id="clip0_4117_1603">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

Control2Switch.displayName = 'Control2Switch';

export default Control2Switch;
