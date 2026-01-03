// Auto-generated from studio-activities-icon-sets/studio-web-icons-data-types/data-types-datetime.svg
import React from 'react';

export interface DataTypesDatetimeProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DataTypesDatetime = React.forwardRef<SVGSVGElement, DataTypesDatetimeProps>(
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
      <g clipPath="url(#clip0_4117_1284)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.2857 3.81818H18.381V2.90476C18.381 2.40508 17.9759 2 17.4762 2C16.9765 2 16.5714 2.40508 16.5714 2.90476V3.81818H7.52381V2.90476C7.52381 2.40508 7.11873 2 6.61905 2C6.11936 2 5.71429 2.40508 5.71429 2.90476V3.81818H4.80952C3.81464 3.81818 3 4.63627 3 5.63636V20.1818C3 21.1819 3.81464 22 4.80952 22H12.4099C11.8515 21.4793 11.3797 20.865 11.0209 20.1818H4.80952V10.1818H21.0952V5.63636C21.0952 4.9581 20.7206 4.36373 20.1693 4.05123C19.9077 3.90297 19.6056 3.81818 19.2857 3.81818ZM4.80952 8.36364H19.2857V5.63636H4.80952V8.36364Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M22 17C22 19.7615 19.7717 22 17.0238 22C14.2759 22 12.0476 19.7615 12.0476 17C12.0476 14.2385 14.2759 12 17.0238 12C19.7717 12 22 14.2385 22 17ZM19.2857 19.017L18.6195 19.7273L16.5714 17.4692V14.2727H17.4992V17.1141L19.2857 19.017Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_4117_1284">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

DataTypesDatetime.displayName = 'DataTypesDatetime';

export default DataTypesDatetime;
