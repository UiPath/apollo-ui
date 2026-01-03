// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-read-list.svg
import React from 'react';

export interface Control1ReadListProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control1ReadList = React.forwardRef<SVGSVGElement, Control1ReadListProps>(
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
      <g clipPath="url(#clip0_4117_1552)">
        <rect x="7" y="6.70605" width="10" height="2" fill="currentColor" />
        <rect x="7" y="10.7061" width="10" height="2" fill="currentColor" />
        <rect x="7" y="14.7061" width="7" height="2" fill="currentColor" />
        <path
          d="M2 3.70605C2 2.60148 2.89543 1.70605 4 1.70605H7V3.70605L4 3.70605V19.7061H7V21.7061H4C2.89543 21.7061 2 20.8106 2 19.7061V3.70605Z"
          fill="currentColor"
        />
        <path
          d="M22 3.70605C22 2.60148 21.1046 1.70605 20 1.70605H17V3.70605L20 3.70605V12.7061H22V3.70605Z"
          fill="currentColor"
        />
        <path
          d="M20 14.7061L20 18.7161L23 18.7161L19 22.7061L15 18.7161L18 18.7161L18 14.7061L20 14.7061Z"
          fill="#1976D2"
        />
      </g>
      <defs>
        <clipPath id="clip0_4117_1552">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

Control1ReadList.displayName = 'Control1ReadList';

export default Control1ReadList;
