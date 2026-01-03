// Auto-generated from studio-activities-icon-sets/studio-web-icons-data-types/data-types-custom.svg
import React from 'react';

export interface DataTypesCustomProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DataTypesCustom = React.forwardRef<SVGSVGElement, DataTypesCustomProps>(
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
      <g clipPath="url(#clip0_4117_1314)">
        <g clipPath="url(#clip1_4117_1314)">
          <path
            d="M20.41 4.795L19.2 3.585C18.42 2.805 17.15 2.805 16.37 3.585L9.69 10.265L7 12.955V16.995H11.04L13.78 14.255L20.41 7.625C21.2 6.845 21.2 5.575 20.41 4.795ZM10.21 14.995H9V13.785L17.66 5.125L18.87 6.335L10.21 14.995Z"
            fill="currentColor"
          />
          <path d="M4 19H20V16H22V21H2V16H4V19Z" fill="currentColor" />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_4117_1314">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
        <clipPath id="clip1_4117_1314">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

DataTypesCustom.displayName = 'DataTypesCustom';

export default DataTypesCustom;
