// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-text-left-right.svg
import React from 'react';

export interface Control1TextLeftRightProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control1TextLeftRight = React.forwardRef<SVGSVGElement, Control1TextLeftRightProps>(
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
      <g clipPath="url(#clip0_4117_1452)">
        <path
          d="M21 21H3V19.5H21V21ZM19.5 16.5H4.5V13.5H19.5V16.5ZM19.5 10.5H4.5V7.5H19.5V10.5ZM21 4.5H3V3H21V4.5Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_4117_1452">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

Control1TextLeftRight.displayName = 'Control1TextLeftRight';

export default Control1TextLeftRight;
