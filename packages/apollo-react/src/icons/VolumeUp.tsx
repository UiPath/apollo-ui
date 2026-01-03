// Auto-generated from action/volume-up.svg
import React from 'react';

export interface VolumeUpProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const VolumeUp = React.forwardRef<SVGSVGElement, VolumeUpProps>(
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
        d="M14 5.29V3.23C18.01 4.14 21 7.72 21 12C21 16.28 18.01 19.86 14 20.77V18.71C16.89 17.85 19 15.17 19 12C19 8.83 16.89 6.15 14 5.29ZM3 15V9H7L12 4V20L7 15H3ZM10 15.17V8.83L7.83 11H5V13H7.83L10 15.17ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12Z"
        fill="currentColor"
      />
    </svg>
  )
);

VolumeUp.displayName = 'VolumeUp';

export default VolumeUp;
