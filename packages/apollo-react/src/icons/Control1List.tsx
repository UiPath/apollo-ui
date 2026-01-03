// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-list.svg
import React from 'react';

export interface Control1ListProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control1List = React.forwardRef<SVGSVGElement, Control1ListProps>(
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
      <g clipPath="url(#clip0_4117_1546)">
        <path
          d="M7 3.70605H4V19.7061H7V21.7061H4C2.89543 21.7061 2 20.8106 2 19.7061V3.70605C2 2.60149 2.89543 1.70605 4 1.70605H7V3.70605ZM20 1.70605C21.1046 1.70605 22 2.60149 22 3.70605V19.7061C22 20.8106 21.1046 21.7061 20 21.7061H17V19.7061H20V3.70605H17V1.70605H20Z"
          fill="currentColor"
        />
        <path
          d="M17 16.7061H7V14.7061H17V16.7061ZM17 12.7061H7V10.7061H17V12.7061ZM17 8.70605H7V6.70605H17V8.70605Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_4117_1546">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

Control1List.displayName = 'Control1List';

export default Control1List;
