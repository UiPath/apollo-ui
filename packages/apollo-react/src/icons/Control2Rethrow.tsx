// Auto-generated from studio-activities-icon-sets/activities-control-2/control-2-rethrow.svg
import React from 'react';

export interface Control2RethrowProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control2Rethrow = React.forwardRef<SVGSVGElement, Control2RethrowProps>(
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
      <g clipPath="url(#clip0_4117_1599)">
        <g clipPath="url(#clip1_4117_1599)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7 11C4.23858 11 2 13.2386 2 16C2 18.7614 4.23858 21 7 21C9.76142 21 12 18.7614 12 16C12 13.2386 9.76142 11 7 11ZM0 16C0 12.134 3.13401 9 7 9C10.866 9 14 12.134 14 16C14 19.866 10.866 23 7 23C3.13401 23 0 19.866 0 16Z"
            fill="currentColor"
          />
          <path d="M8 13H6V16H8V13Z" fill="currentColor" />
          <path d="M8 17H6V19H8V17Z" fill="currentColor" />
          <path
            d="M21 1C22.1 1 22.9902 1.9 22.9902 3V15H23C23 16.0311 22.2092 16.8862 21.2041 16.9893L21 17H18.9902V20L15 16L18.9902 12V15H21V3H3V7H1V3C1 1.9 1.9 1 3 1H21Z"
            fill="currentColor"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_4117_1599">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
        <clipPath id="clip1_4117_1599">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

Control2Rethrow.displayName = 'Control2Rethrow';

export default Control2Rethrow;
