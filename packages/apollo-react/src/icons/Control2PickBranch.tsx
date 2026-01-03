// Auto-generated from studio-activities-icon-sets/activities-control-2/control-2-pick-branch.svg
import React from 'react';

export interface Control2PickBranchProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control2PickBranch = React.forwardRef<SVGSVGElement, Control2PickBranchProps>(
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
      <g clipPath="url(#clip0_4117_1628)">
        <path
          d="M10 20L7.71 17.71L10.59 14.83L9.17 13.41L6.29 16.29L4 14V20L10 20ZM14 20H20V14L17.71 16.29L13 11.59L13 4H11V12.41L16.29 17.71L14 20Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.6745 10.6549L15.7248 8.70511L14.3105 10.1193L17.6745 13.4833L23.0385 8.11932L21.6243 6.70511L17.6745 10.6549Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_4117_1628">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

Control2PickBranch.displayName = 'Control2PickBranch';

export default Control2PickBranch;
