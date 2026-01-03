// Auto-generated from object/data-storage.svg
import React from 'react';

export interface DataStorageProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DataStorage = React.forwardRef<SVGSVGElement, DataStorageProps>(
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
        d="M2 4V8H22V4H2ZM22 20H2V16H22V20ZM6 17H4V19H6V17ZM4 7H6V5H4V7ZM2 14H22V10H2V14ZM6 11H4V13H6V11Z"
        fill="currentColor"
      />
    </svg>
  )
);

DataStorage.displayName = 'DataStorage';

export default DataStorage;
