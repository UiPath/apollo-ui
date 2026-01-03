// Auto-generated from third-party/microsoft-calendar.svg
import React from 'react';

export interface MicrosoftCalendarProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const MicrosoftCalendar = React.forwardRef<SVGSVGElement, MicrosoftCalendarProps>(
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
      <g clipPath="url(#clip0_2_1821)">
        <rect x="2.57031" y="4.14285" width="6.28571" height="6.28571" fill="#0F77D3" />
        <rect x="2.57031" y="10.4286" width="6.28571" height="6.28572" fill="#0564B1" />
        <path
          d="M2.57031 16.7143H8.85603V23H4.57031C3.46574 23 2.57031 22.1046 2.57031 21V16.7143Z"
          fill="#123A6D"
        />
        <rect x="8.85547" y="4.14282" width="6.28571" height="6.28572" fill="#36B8F0" />
        <rect x="8.85547" y="10.4286" width="6.28571" height="6.28572" fill="#0F77D3" />
        <rect x="8.85547" y="16.7142" width="6.28571" height="6.28572" fill="#0564B1" />
        <rect x="15.1426" y="4.14282" width="6.28571" height="6.28572" fill="#56DBFF" />
        <rect x="15.1426" y="10.4286" width="6.28571" height="6.28572" fill="#34B7F0" />
        <path
          d="M15.1426 16.7142H21.4283V20.9999C21.4283 22.1045 20.5329 22.9999 19.4283 22.9999H15.1426V16.7142Z"
          fill="#0F77D3"
        />
        <path
          d="M2.57031 3C2.57031 1.89543 3.46574 1 4.57031 1H19.4275C20.532 1 21.4275 1.89543 21.4275 3V4.14286H2.57031V3Z"
          fill="#0660AD"
        />
      </g>
      <defs>
        <clipPath id="clip0_2_1821">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
);

MicrosoftCalendar.displayName = 'MicrosoftCalendar';

export default MicrosoftCalendar;
