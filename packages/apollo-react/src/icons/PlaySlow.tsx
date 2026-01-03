// Auto-generated from action/play-slow.svg
import React from 'react';

export interface PlaySlowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const PlaySlow = React.forwardRef<SVGSVGElement, PlaySlowProps>(
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
        d="M10.9749 2.05V4.07C9.5149 4.25 8.1849 4.83 7.0749 5.69L5.6549 4.26C7.1349 3.05 8.9649 2.25 10.9749 2.05ZM13.0249 9.79L9.9749 7.5V16.5L13.0249 14.21L15.9749 12L13.0249 9.79ZM5.6649 7.1L4.2349 5.68C3.0249 7.16 2.2249 8.99 2.0249 11H4.0449C4.2249 9.54 4.8049 8.21 5.6649 7.1ZM2.0249 13H4.0449C4.2249 14.46 4.8049 15.79 5.6649 16.89L4.2349 18.32C3.0249 16.84 2.2249 15.01 2.0249 13ZM5.6549 19.74C7.1349 20.95 8.9749 21.75 10.9749 21.95V19.93C9.5149 19.75 8.1849 19.17 7.0749 18.31L5.6549 19.74ZM13.0249 21.95C18.0549 21.42 21.9749 17.16 21.9749 12C21.9749 6.84 18.0549 2.58 13.0249 2.05V4.07C16.9449 4.59 19.9749 7.95 19.9749 12C19.9749 16.05 16.9449 19.41 13.0249 19.93V21.95Z"
        fill="currentColor"
      />
    </svg>
  )
);

PlaySlow.displayName = 'PlaySlow';

export default PlaySlow;
